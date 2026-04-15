import { ExecutionRun } from '../../infrastructure/database/models/ExecutionRun';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { AgentNode, IAgentNode } from '../../infrastructure/database/models/AgentNode';
import { AgentEdge, IAgentEdge } from '../../infrastructure/database/models/AgentEdge';
import { simulateInputNode } from './simulators/input-node-simulator';
import { simulateProcessingNode } from './simulators/processing-node-simulator';
import { simulateActionNode } from './simulators/action-node-simulator';
import { simulateConditionNode } from './simulators/condition-node-simulator';
import { simulateOutputNode } from './simulators/output-node-simulator';
import { simulateTelegramSendMessage } from './simulators/telegram-node-simulator';
import { simulateWhatsAppSendMessage } from './simulators/whatsapp-node-simulator';
import { simulateCryptoWallet } from './simulators/crypto/wallet-simulator';
import { simulateCryptoTrade } from './simulators/crypto/trade-simulator';
import { simulateBlockchainNode } from './simulators/blockchain-node-simulator';
import { enhancedLog, timestamp } from './simulators/base';
import { executionEmitter } from '../../modules/executions/execution.events';
import { User } from '../../infrastructure/database/models/User';
import { tokensForExecution, getNodeLimit, PLANS, PlanId } from '../../shared/constants/tokens';
import { NodeOutput } from '../contracts/base';

interface SaveQueue {
  [executionId: string]: Promise<unknown>;
}

export class FlowEngine {
  private static saveQueues: SaveQueue = {};

  private static async safeSave(execution: any) {
    const id = execution._id.toString();
    const currentQueue = this.saveQueues[id] || Promise.resolve();
    this.saveQueues[id] = currentQueue.then(async () => {
      try {
        await execution.save();
      } catch (err) {
        console.error(`[FlowEngine] SafeSave failed for ${id}:`, err);
      }
    });
    return this.saveQueues[id];
  }

  static async runExecution(executionId: string) {
    console.log(`\n[FlowEngine] 🚀 Starting execution: ${executionId}`);
    const execution = await ExecutionRun.findById(executionId);
    if (!execution) throw new Error('Execution not found');

    const agent = await AgentDefinition.findById(execution.agentDefinitionId);
    if (!agent) {
      execution.status = 'failed';
      execution.error = 'Agent definition not found';
      await execution.save();
      return;
    }

    console.log(`[FlowEngine] 🤖 Agent: ${agent.name} (${agent._id})`);
    execution.status = 'running';
    execution.startedAt = new Date();
    await execution.save();

    const nodeDocs = await AgentNode.find({ agentId: agent._id });
    const edgeDocs = await AgentEdge.find({ agentId: agent._id });

    // ── Token & node-limit enforcement ───────────────────────────────────────
    const connectedNodeIds = new Set<string>();
    edgeDocs.forEach((e: any) => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });
    const connectedCount = connectedNodeIds.size;

    const user = execution.triggeredBy ? await User.findById(execution.triggeredBy) : null;
    if (user) {
      const planId = (user.plan ?? 'free') as PlanId;
      const nodeLimit = getNodeLimit(planId);

      if (nodeLimit !== -1 && connectedCount > nodeLimit) {
        const msg = `Node limit exceeded: your ${PLANS[planId]?.name ?? planId} plan allows up to ${nodeLimit} connected nodes. This agent has ${connectedCount}. Upgrade to run larger flows.`;
        execution.status = 'failed';
        execution.error = msg;
        await execution.save();
        executionEmitter.emit(`execution-${executionId}`, { status: 'failed', error: msg });
        return;
      }

      const cost = tokensForExecution(connectedCount);
      if (user.tokens < cost) {
        const msg = `Insufficient tokens: this execution requires ${cost} tokens (${connectedCount} nodes × 50) but you only have ${user.tokens}. Top up or upgrade your plan.`;
        execution.status = 'failed';
        execution.error = msg;
        await execution.save();
        executionEmitter.emit(`execution-${executionId}`, { status: 'failed', error: msg });
        return;
      }

      await User.findByIdAndUpdate(user._id, { $inc: { tokens: -cost } });
      console.log(`[FlowEngine] 🪙 Deducted ${cost} tokens from user ${user._id} (${connectedCount} nodes)`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const nodes = nodeDocs.map((n: IAgentNode) => ({
      id: n.nodeId,
      type: n.type,
      data: { ...(n.data as Record<string, unknown>), chain: n.chain, tool: n.tool, params: n.params } as Record<string, unknown>,
    }));

    const edges = edgeDocs.map((e: IAgentEdge) => ({
      id: e.edgeId,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }));

    let currentNodes = nodes.filter((n: any) => n.type === 'input' || n.type === 'telegram_trigger');
    const executedNodeIds = new Set<string>();

    try {
      while (currentNodes.length > 0) {
        const nextNodes: typeof currentNodes = [];

        for (const node of currentNodes) {
          if (executedNodeIds.has(node.id)) continue;

          const consoleOutput: string[] = execution.state[node.id]?.consoleOutput || [];

          // Proxy push for real-time log broadcasting
          const originalPush = consoleOutput.push;
          consoleOutput.push = function (...items: string[]) {
            const res = originalPush.apply(this, items);
            console.log(`[FlowEngine] [LOG] [${node.id}]:`, ...items);
            execution.state[node.id] = {
              ...(execution.state[node.id] || {}),
              consoleOutput,
              status: 'running',
            };
            execution.markModified('state');
            FlowEngine.safeSave(execution);
            executionEmitter.emit(`execution-${executionId}`, {
              nodeId: node.id,
              status: 'running',
              state: execution.state,
              consoleOutput,
              timestamp: new Date().toISOString(),
            });
            return res;
          };

          const nodeName = (node.data as { name?: string })?.name || node.type;
          console.log(`[FlowEngine] 📍 Executing node: ${nodeName} (${node.id})`);
          consoleOutput.push(`${timestamp()} 🚀 Starting: ${nodeName}`);

          const inputValues = FlowEngine.getInputValues(node.id, nodes, edges, execution.state);
          let output: NodeOutput<object>;

          switch (node.type) {
            case 'input':
              output = simulateInputNode(node.data, inputValues);
              break;
            case 'processing':
              output = await simulateProcessingNode(node.data, inputValues, consoleOutput, agent);
              break;
            case 'action':
              output = await simulateActionNode(node.data, inputValues);
              break;
            case 'condition':
              output = simulateConditionNode(node.data, inputValues);
              break;
            case 'output':
              output = simulateOutputNode(node.data, inputValues);
              break;
            case 'telegram':
              output = await simulateTelegramSendMessage(node.data, inputValues, consoleOutput);
              break;
            case 'whatsapp':
              output = await simulateWhatsAppSendMessage(node.data, inputValues, consoleOutput);
              break;
            case 'crypto_wallet':
              output = await simulateCryptoWallet(node.data, inputValues, agent);
              break;
            case 'crypto_trade':
              output = simulateCryptoTrade(node.data, inputValues);
              break;
            case 'blockchain_tool':
              output = await simulateBlockchainNode(node.data, inputValues, consoleOutput);
              break;
            default:
              console.log(`[FlowEngine] ⚠️ Unsupported node type: ${node.type}`);
              consoleOutput.push(`${timestamp()} ⚠️ Unsupported node type: ${node.type}`);
              output = {
                result: { status: 'skipped' },
                status: 'error',
                confidence: 0,
                timestamp: new Date().toISOString(),
                request_id: crypto.randomUUID(),
                message: `Unsupported node type: ${node.type}`,
              };
          }

          // ── Structured output logging ─────────────────────────────────────
          if (output.status === 'error') {
            consoleOutput.push(`${timestamp()} ❌ [ERROR] ${output.message ?? 'Node failed'}`);
          } else {
            // Log a compact summary of the result for the console
            const resultPreview = JSON.stringify(output.result).substring(0, 300);
            consoleOutput.push(`${timestamp()} 📤 [OUTPUT] ${resultPreview}${resultPreview.length >= 300 ? '…' : ''}`);
            consoleOutput.push(`${timestamp()} ✅ [DONE] confidence=${(output.confidence * 100).toFixed(0)}%${output.metadata?.executionMs !== undefined ? ` time=${output.metadata.executionMs}ms` : ''}${output.metadata?.modelUsed ? ` model=${output.metadata.modelUsed}` : ''}${output.metadata?.toolName ? ` tool=${output.metadata.toolName}` : ''}`);
          }
          if (Object.keys(inputValues).length > 0) {
            const inputPreview = JSON.stringify(inputValues).substring(0, 200);
            consoleOutput.push(`${timestamp()} 📥 [INPUT] ${inputPreview}${inputPreview.length >= 200 ? '…' : ''}`);
          }
          // ─────────────────────────────────────────────────────────────────

          execution.state[node.id] = {
            ...execution.state[node.id],
            inputValues,
            outputData: output,          // stored as full NodeOutput envelope
            consoleOutput,
            status: output.status === 'error' ? 'failed' : 'completed',
            completedAt: new Date(),
          };

          execution.markModified('state');
          await execution.save();

          console.log(`[FlowEngine] ✅ Node completed: ${nodeName}`);
          executionEmitter.emit(`execution-${executionId}`, {
            nodeId: node.id,
            status: output.status === 'error' ? 'failed' : 'completed',
            state: execution.state,
            consoleOutput,
            timestamp: new Date().toISOString(),
          });

          executedNodeIds.add(node.id);

          // Only propagate downstream if node succeeded or is not a terminal error
          const shouldPropagate = output.status === 'success' || node.type === 'condition';
          if (shouldPropagate) {
            const downstream = edges
              .filter((e: any) => e.source === node.id)
              .map((e: any) => nodes.find((n: any) => n.id === e.target))
              .filter(n => n && !executedNodeIds.has(n.id)) as Array<{ id: string; type: string; data: Record<string, unknown> }>;
            nextNodes.push(...downstream);
          }
        }

        currentNodes = nextNodes;
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      await execution.save();
      console.log(`[FlowEngine] ✨ Execution finished: ${executionId}\n`);
      executionEmitter.emit(`execution-${executionId}`, { status: 'completed', state: execution.state });

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[FlowEngine] ❌ Execution failed:`, error);
      enhancedLog('Flow execution failed', { executionId, error: msg });
      execution.status = 'failed';
      execution.error = msg;
      await execution.save();
      executionEmitter.emit(`execution-${executionId}`, { status: 'failed', error: msg });
    }
  }

  /**
   * Resolves inputValues for a node from upstream NodeOutput envelopes.
   *
   * With the new envelope format, outputData is NodeOutput<T>.
   * We read from outputData.result (not outputData directly) so the
   * business data flows clean and the envelope metadata stays transparent.
   *
   * Edge handle semantics are preserved:
   *   sourceHandle=undefined  → spread entire result into inputValues
   *   sourceHandle='keyName'  → pass result['keyName'] to targetHandle
   */
  private static getInputValues(
    nodeId: string,
    nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>,
    edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>,
    state: Record<string, any>
  ): Record<string, unknown> {
    const inputValues: Record<string, unknown> = {};
    const incomingEdges = edges.filter((e: any) => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceState = state[edge.source];
      if (!sourceState?.outputData) continue;

      const output = sourceState.outputData as NodeOutput<object>;

      // Forward upstream error context without blocking downstream
      if (output.status === 'error') {
        inputValues['_upstream_error'] = output.message ?? 'upstream node failed';
        continue;
      }

      const result = output.result as Record<string, unknown>;
      let val: unknown;

      if (edge.sourceHandle && result[edge.sourceHandle] !== undefined) {
        val = result[edge.sourceHandle];
      } else if (!edge.sourceHandle) {
        val = result;
      } else {
        // Fallback: first available value
        const keys = Object.keys(result);
        if (keys.length > 0) val = result[keys[0]];
      }

      if (val === undefined) continue;

      if (edge.targetHandle) {
        inputValues[edge.targetHandle] = val;
      } else {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          Object.assign(inputValues, val);
        } else {
          inputValues['value'] = val;
        }
      }
    }

    return inputValues;
  }
}
