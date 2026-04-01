import { ExecutionRun, IExecutionRun } from '../models/ExecutionRun';
import { AgentDefinition } from '../models/AgentDefinition';
import { AgentNode, IAgentNode } from '../models/AgentNode';
import { AgentEdge, IAgentEdge } from '../models/AgentEdge';
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
import { executionEmitter } from '../services/ExecutionEmitter';
import { User } from '../models/User';
import { tokensForExecution, getNodeLimit, PLANS, PlanId } from '../lib/tokens';

interface SaveQueue {
    [executionId: string]: Promise<any>;
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

        // ── Token & node-limit enforcement ────────────────────────────────────
        const connectedNodeIds = new Set<string>();
        edgeDocs.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });
        const connectedCount = connectedNodeIds.size;

        const user = execution.triggeredBy ? await User.findById(execution.triggeredBy) : null;
        if (user) {
            const planId = (user.plan ?? 'free') as PlanId;
            const nodeLimit = getNodeLimit(planId);

            if (nodeLimit !== -1 && connectedCount > nodeLimit) {
                execution.status = 'failed';
                execution.error = `Node limit exceeded: your ${PLANS[planId]?.name ?? planId} plan allows up to ${nodeLimit} connected nodes. This agent has ${connectedCount}. Upgrade to run larger flows.`;
                await execution.save();
                executionEmitter.emit(`execution-${executionId}`, { status: 'failed', error: execution.error });
                return;
            }

            const cost = tokensForExecution(connectedCount);
            if (user.tokens < cost) {
                execution.status = 'failed';
                execution.error = `Insufficient tokens: this execution requires ${cost} tokens (${connectedCount} nodes × 50) but you only have ${user.tokens}. Top up or upgrade your plan.`;
                await execution.save();
                executionEmitter.emit(`execution-${executionId}`, { status: 'failed', error: execution.error });
                return;
            }

            // Deduct upfront
            await User.findByIdAndUpdate(user._id, { $inc: { tokens: -cost } });
            console.log(`[FlowEngine] 🪙 Deducted ${cost} tokens from user ${user._id} (${connectedCount} nodes)`);
        }
        // ─────────────────────────────────────────────────────────────────────

        // Map database nodes back to the format the engine expects
        const nodes = nodeDocs.map((n: IAgentNode) => ({
            id: n.nodeId,
            type: n.type,
            data: {
                ...(n.data as any),
                chain: n.chain,
                tool: n.tool,
                params: n.params
            }
        }));

        const edges = edgeDocs.map((e: IAgentEdge) => ({
            id: e.edgeId,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle
        }));

        // Simple execution: find triggers/inputs first
        let currentNodes = nodes.filter(n => n.type === 'input' || n.type === 'telegram_trigger');
        const executedNodeIds = new Set<string>();

        try {
            while (currentNodes.length > 0) {
                const nextNodes: any[] = [];

                for (const node of currentNodes) {
                    if (executedNodeIds.has(node.id)) continue;

                    const consoleOutput: string[] = execution.state[node.id]?.consoleOutput || [];

                    // Proxy push to broadcast logs in true real-time
                    const originalPush = consoleOutput.push;
                    consoleOutput.push = function (...items: string[]) {
                        const res = originalPush.apply(this, items);
                        console.log(`[FlowEngine] [LOG] [${node.id}]:`, ...items);

                        execution.state[node.id] = {
                            ...(execution.state[node.id] || {}),
                            consoleOutput,
                            status: 'running'
                        };
                        execution.markModified('state');
                        FlowEngine.safeSave(execution); // No await here, we just queue it

                        executionEmitter.emit(`execution-${executionId}`, {
                            nodeId: node.id,
                            status: 'running',
                            state: execution.state,
                            consoleOutput,
                            timestamp: new Date().toISOString()
                        });

                        return res;
                    };

                    const nodeName = node.data?.name || node.type;
                    console.log(`[FlowEngine] 📍 Executing Node: ${nodeName} (${node.id})`);
                    consoleOutput.push(`${timestamp()} 🚀 Starting Node Execution: ${nodeName}`);

                    const inputValues = FlowEngine.getInputValues(node.id, nodes, edges, execution.state);
                    let result: any;

                    switch (node.type) {
                        case 'input':
                            result = await simulateInputNode(node.data);
                            break;
                        case 'processing':
                            result = await simulateProcessingNode(node.data, inputValues, consoleOutput, agent);
                            break;
                        case 'action':
                            result = await simulateActionNode(node.data, inputValues);
                            break;
                        case 'condition':
                            result = await simulateConditionNode(node.data, inputValues);
                            break;
                        case 'output':
                            result = await simulateOutputNode(node.data, inputValues);
                            break;
                        case 'telegram':
                            result = await simulateTelegramSendMessage(node.data, inputValues, consoleOutput);
                            break;
                        case 'whatsapp':
                            result = await simulateWhatsAppSendMessage(node.data, inputValues, consoleOutput);
                            break;
                        case 'crypto_wallet':
                            result = await (simulateCryptoWallet as any)(node.data, inputValues, agent);
                            break;
                        case 'crypto_trade':
                            result = await simulateCryptoTrade(node.data, inputValues);
                            break;
                        case 'blockchain_tool':
                            result = await simulateBlockchainNode(node.data, inputValues, consoleOutput);
                            break;
                        default:
                            console.log(`[FlowEngine] ⚠️ Unsupported node type: ${node.type}`);
                            consoleOutput.push(`${timestamp()} ⚠️ Unsupported node type: ${node.type}`);
                            result = { status: 'skipped' };
                    }

                    // Update execution state for this node
                    execution.state[node.id] = {
                        ...execution.state[node.id],
                        inputValues,
                        outputData: result.outputData || result,
                        consoleOutput,
                        status: 'completed',
                        completedAt: new Date()
                    };

                    // Mark as modified for Mongoose Mixed type
                    execution.markModified('state');
                    await execution.save();

                    console.log(`[FlowEngine] ✅ Node Completed: ${nodeName}`);

                    // Emit real-time log payload to any active SSE clients
                    executionEmitter.emit(`execution-${executionId}`, {
                        nodeId: node.id,
                        status: 'completed',
                        state: execution.state,
                        consoleOutput: consoleOutput,
                        timestamp: new Date().toISOString()
                    });

                    executedNodeIds.add(node.id);

                    // Find downstream nodes
                    const downstream = edges
                        .filter(e => e.source === node.id)
                        .map(e => nodes.find(n => n.id === e.target))
                        .filter(n => n && !executedNodeIds.has(n.id));

                    nextNodes.push(...downstream);
                }

                currentNodes = nextNodes;
            }

            execution.status = 'completed';
            execution.completedAt = new Date();
            await execution.save();
            console.log(`[FlowEngine] ✨ Execution Finished: ${executionId}\n`);

            executionEmitter.emit(`execution-${executionId}`, {
                status: 'completed',
                state: execution.state
            });

        } catch (error: any) {
            console.error(`[FlowEngine] ❌ Execution Failed:`, error);
            enhancedLog(`Flow execution failed`, { executionId, error: error.message });
            execution.status = 'failed';
            execution.error = error.message;
            await execution.save();

            executionEmitter.emit(`execution-${executionId}`, {
                status: 'failed',
                error: error.message
            });
        }
    }

    private static getInputValues(nodeId: string, nodes: any[], edges: any[], state: any) {
        const inputValues: Record<string, any> = {};
        const incomingEdges = edges.filter(e => e.target === nodeId);

        incomingEdges.forEach(edge => {
            const sourceState = state[edge.source];
            if (sourceState && sourceState.outputData) {
                let val;
                if (edge.sourceHandle && sourceState.outputData[edge.sourceHandle] !== undefined) {
                    val = sourceState.outputData[edge.sourceHandle];
                } else if (!edge.sourceHandle) {
                    // Use entire outputData for generic source connections
                    val = sourceState.outputData;
                } else {
                    // Fallback to first available value for backwards compatibility
                    const keys = Object.keys(sourceState.outputData);
                    if (keys.length > 0) val = sourceState.outputData[keys[0]];
                }

                if (val !== undefined) {
                    if (edge.targetHandle) {
                        inputValues[edge.targetHandle] = val;
                    } else {
                        // Merge into top-level if no target handle (generic input)
                        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                            Object.assign(inputValues, val);
                        } else {
                            // If it's a primitive and generic, we just store it as 'value' or similar
                            inputValues['value'] = val;
                        }
                    }
                }
            }
        });

        return inputValues;
    }
}
