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

export class FlowEngine {
    static async runExecution(executionId: string) {
        const execution = await ExecutionRun.findById(executionId);
        if (!execution) throw new Error('Execution not found');

        const agent = await AgentDefinition.findById(execution.agentDefinitionId);
        if (!agent) {
            execution.status = 'failed';
            execution.error = 'Agent definition not found';
            await execution.save();
            return;
        }

        execution.status = 'running';
        execution.startedAt = new Date();
        await execution.save();

        const nodeDocs = await AgentNode.find({ agentId: agent._id });
        const edgeDocs = await AgentEdge.find({ agentId: agent._id });

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

                        execution.state[node.id] = {
                            ...(execution.state[node.id] || {}),
                            consoleOutput,
                            status: 'running'
                        };
                        execution.markModified('state');
                        execution.save().catch(console.error);

                        executionEmitter.emit(`execution-${executionId}`, {
                            nodeId: node.id,
                            status: 'running',
                            state: execution.state,
                            consoleOutput,
                            timestamp: new Date().toISOString()
                        });

                        return res;
                    };

                    consoleOutput.push(`${timestamp()} 🚀 Starting Node Execution: ${node.data?.name || node.type}`);

                    const inputValues = this.getInputValues(node.id, nodes, edges, execution.state);
                    let result: any;

                    switch (node.type) {
                        case 'input':
                            result = await simulateInputNode(node.data);
                            break;
                        case 'processing':
                            result = await simulateProcessingNode(node.data, inputValues, consoleOutput);
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
                            result = await simulateCryptoWallet(node.data);
                            break;
                        case 'crypto_trade':
                            result = await simulateCryptoTrade(node.data, inputValues);
                            break;
                        case 'blockchain_tool':
                            result = await simulateBlockchainNode(node.data, inputValues, consoleOutput);
                            break;
                        default:
                            consoleOutput.push(`${timestamp()} ⚠️ Unsupported node type: ${node.type}`);
                            result = { status: 'skipped' };
                    }

                    // Update execution state for this node
                    execution.state[node.id] = {
                        ...execution.state[node.id],
                        outputData: result.outputData || result,
                        consoleOutput,
                        status: 'completed',
                        completedAt: new Date()
                    };

                    // Mark as modified for Mongoose Mixed type
                    execution.markModified('state');
                    await execution.save();

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

            executionEmitter.emit(`execution-${executionId}`, {
                status: 'completed',
                state: execution.state
            });

        } catch (error: any) {
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
                } else {
                    // Fallback to first available value
                    const keys = Object.keys(sourceState.outputData);
                    if (keys.length > 0) val = sourceState.outputData[keys[0]];
                }

                if (val !== undefined && edge.targetHandle) {
                    inputValues[edge.targetHandle] = val;
                }
            }
        });

        return inputValues;
    }
}
