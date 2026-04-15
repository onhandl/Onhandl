import { FastifyPluginAsync } from 'fastify';
import { simulateInputNode } from '../engine/simulators/input-node-simulator';
import { simulateProcessingNode } from '../engine/simulators/processing-node-simulator';
import { simulateActionNode } from '../engine/simulators/action-node-simulator';
import { simulateConditionNode } from '../engine/simulators/condition-node-simulator';
import { simulateOutputNode } from '../engine/simulators/output-node-simulator';
import { simulateTelegramSendMessage } from '../engine/simulators/telegram-node-simulator';
import { simulateWhatsAppSendMessage } from '../engine/simulators/whatsapp-node-simulator';
import { simulateCryptoWallet } from '../engine/simulators/crypto/wallet-simulator';
import { simulateCryptoTrade } from '../engine/simulators/crypto/trade-simulator';
import { simulateBlockchainNode } from '../engine/simulators/blockchain-node-simulator';
import { AgentDefinition } from '../models/AgentDefinition';

export const simulateRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { node?: any; nodeData?: any; nodeType?: string; inputValues?: Record<string, unknown>; agentId?: string } }>(
        '/node',
        async (request, reply) => {
            const { node, nodeData, nodeType, inputValues = {}, agentId } = request.body;

            // Support both formats: { node: { type, data } } and { nodeType, nodeData }
            const finalNode = node || { type: nodeType, data: nodeData };

            if (!finalNode || !finalNode.type) {
                return reply.code(400).send({ error: 'Node and Node Type are required' });
            }

            const consoleOutput: string[] = [];
            let agent = null;
            if (agentId) {
                agent = await AgentDefinition.findById(agentId);
            }

            try {
                let output;
                switch (finalNode.type) {
                    case 'input':
                        output = simulateInputNode(finalNode.data, inputValues);
                        break;
                    case 'processing':
                        output = await simulateProcessingNode(finalNode.data, inputValues, consoleOutput, agent);
                        break;
                    case 'action':
                        output = await simulateActionNode(finalNode.data, inputValues);
                        break;
                    case 'condition':
                        output = simulateConditionNode(finalNode.data, inputValues);
                        break;
                    case 'output':
                        output = simulateOutputNode(finalNode.data, inputValues);
                        break;
                    case 'telegram':
                        output = await simulateTelegramSendMessage(finalNode.data, inputValues, consoleOutput);
                        break;
                    case 'whatsapp':
                        output = await simulateWhatsAppSendMessage(finalNode.data, inputValues, consoleOutput);
                        break;
                    case 'crypto_wallet':
                        output = await simulateCryptoWallet(finalNode.data, inputValues, agent);
                        break;
                    case 'crypto_trade':
                        output = simulateCryptoTrade(finalNode.data, inputValues);
                        break;
                    case 'blockchain_tool':
                        output = await simulateBlockchainNode(finalNode.data, inputValues, consoleOutput);
                        break;
                    default:
                        return reply.code(400).send({ error: `Unsupported node type: ${finalNode.type}` });
                }

                return {
                    ...output,
                    consoleOutput
                };
            } catch (error: any) {
                console.error(`[SimulateRoute] Error simulating node ${node.type}:`, error);
                return reply.code(500).send({ error: error.message });
            }
        }
    );
};
