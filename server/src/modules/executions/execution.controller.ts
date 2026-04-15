import { FastifyInstance } from 'fastify';
import { Readable } from 'stream';
import { ExecutionRun } from '../../infrastructure/database/models/ExecutionRun';
import { eventBus } from '../../infrastructure/events/eventBus';
import { FlowEngine } from '../../core/engine/FlowEngine';
import { executionEmitter } from './execution.events';
import { simulateInputNode } from '../../core/engine/simulators/input-node-simulator';
import { simulateProcessingNode } from '../../core/engine/simulators/processing-node-simulator';
import { simulateActionNode } from '../../core/engine/simulators/action-node-simulator';
import { simulateConditionNode } from '../../core/engine/simulators/condition-node-simulator';
import { simulateOutputNode } from '../../core/engine/simulators/output-node-simulator';
import { simulateTelegramSendMessage } from '../../core/engine/simulators/telegram-node-simulator';
import { simulateWhatsAppSendMessage } from '../../core/engine/simulators/whatsapp-node-simulator';
import { simulateCryptoWallet } from '../../core/engine/simulators/crypto/wallet-simulator';
import { simulateCryptoTrade } from '../../core/engine/simulators/crypto/trade-simulator';
import { simulateBlockchainNode } from '../../core/engine/simulators/blockchain-node-simulator';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';

export async function executionController(fastify: FastifyInstance) {
    // ── Get execution ──────────────────────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const execution = await ExecutionRun.findById(request.params.id);
        if (!execution) return reply.code(404).send({ message: 'Execution not found' });
        return execution;
    });

    // ── SSE stream ────────────────────────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/:id/stream', (request, reply) => {
        const { id } = request.params;
        const origin = request.headers.origin || 'http://localhost:3000';
        const stream = new Readable({ read() { } });
        stream.push(`data: ${JSON.stringify({ type: 'connected', executionId: id })}\n\n`);

        const listener = (data: any) => {
            stream.push(`data: ${JSON.stringify(data)}\n\n`);
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'done') {
                executionEmitter.removeListener(`execution-${id}`, listener);
                stream.push(null);
            }
        };

        executionEmitter.on(`execution-${id}`, listener);
        request.raw.on('close', () => {
            executionEmitter.removeListener(`execution-${id}`, listener);
            stream.destroy();
        });

        return reply
            .header('Content-Type', 'text/event-stream')
            .header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive')
            .header('Access-Control-Allow-Origin', origin)
            .header('Access-Control-Allow-Credentials', 'true')
            .send(stream);
    });

    // ── List executions ────────────────────────────────────────────────────────
    fastify.get<{ Querystring: { agentId: string } }>('/', async (request) => {
        const { agentId } = request.query;
        const filter = agentId ? { agentDefinitionId: agentId } : {};
        return ExecutionRun.find(filter).sort({ createdAt: -1 });
    });

    // ── Start execution ────────────────────────────────────────────────────────
    fastify.post<{ Body: { agentId: string; triggeredBy?: string; initialState?: any } }>(
        '/',
        async (request, reply) => {
            const { agentId, triggeredBy, initialState } = request.body;
            const execution = new ExecutionRun({
                agentDefinitionId: agentId,
                triggeredBy,
                state: initialState || {},
                status: 'pending',
            });
            await execution.save();
            eventBus.emit('agent.run.started', { executionId: execution._id, agentId });
            FlowEngine.runExecution(execution._id.toString()).catch(console.error);
            return reply.code(201).send(execution);
        }
    );

    // ── Node simulation ────────────────────────────────────────────────────────
    fastify.post<{ Body: { node?: any; nodeData?: any; nodeType?: string; inputValues?: Record<string, unknown>; agentId?: string } }>(
        '/simulate/node',
        async (request, reply) => {
            const { node, nodeData, nodeType, inputValues = {}, agentId } = request.body;
            const finalNode = node || { type: nodeType, data: nodeData };

            if (!finalNode || !finalNode.type) return reply.code(400).send({ error: 'Node and Node Type are required' });

            const consoleOutput: string[] = [];
            let agent = null;
            if (agentId) agent = await AgentDefinition.findById(agentId);

            try {
                let output;
                switch (finalNode.type) {
                    case 'input': output = simulateInputNode(finalNode.data, inputValues); break;
                    case 'processing': output = await simulateProcessingNode(finalNode.data, inputValues, consoleOutput, agent); break;
                    case 'action': output = await simulateActionNode(finalNode.data, inputValues); break;
                    case 'condition': output = simulateConditionNode(finalNode.data, inputValues); break;
                    case 'output': output = simulateOutputNode(finalNode.data, inputValues); break;
                    case 'telegram': output = await simulateTelegramSendMessage(finalNode.data, inputValues, consoleOutput); break;
                    case 'whatsapp': output = await simulateWhatsAppSendMessage(finalNode.data, inputValues, consoleOutput); break;
                    case 'crypto_wallet': output = await simulateCryptoWallet(finalNode.data, inputValues, agent); break;
                    case 'crypto_trade': output = simulateCryptoTrade(finalNode.data, inputValues); break;
                    case 'blockchain_tool': output = await simulateBlockchainNode(finalNode.data, inputValues, consoleOutput); break;
                    default: return reply.code(400).send({ error: `Unsupported node type: ${finalNode.type}` });
                }
                return { ...output, consoleOutput };
            } catch (error: any) {
                console.error(`[SimulateRoute] Error simulating node ${finalNode.type}:`, error);
                return reply.code(500).send({ error: error.message });
            }
        }
    );
}
