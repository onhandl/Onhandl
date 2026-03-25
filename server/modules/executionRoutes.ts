import { FastifyPluginAsync } from 'fastify';
import { ExecutionRun } from '../models/ExecutionRun';
import { eventBus } from '../lib/eventBus';
import { FlowEngine } from '../engine/FlowEngine';
import { executionEmitter } from '../services/ExecutionEmitter';

export const executionRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get<{ Params: { id: string } }>('/executions/:id', async (request, reply) => {
        const { id } = request.params;
        const execution = await ExecutionRun.findById(id);
        if (!execution) return reply.code(404).send({ message: 'Execution not found' });
        return execution;
    });

    fastify.get<{ Params: { id: string } }>('/executions/:id/stream', (request, reply) => {
        const { id } = request.params;

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        reply.raw.write(`data: ${JSON.stringify({ type: 'connected', executionId: id })}\n\n`);

        const listener = (data: any) => {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'done') {
                executionEmitter.removeListener(`execution-${id}`, listener);
                // Optionally reply.raw.end() if the client shouldn't keep waiting
            }
        };

        executionEmitter.on(`execution-${id}`, listener);

        request.raw.on('close', () => {
            executionEmitter.removeListener(`execution-${id}`, listener);
        });
    });

    fastify.get<{ Querystring: { agentId: string } }>('/executions', async (request, reply) => {
        const { agentId } = request.query;
        const filter = agentId ? { agentDefinitionId: agentId } : {};
        const executions = await ExecutionRun.find(filter).sort({ createdAt: -1 });
        return executions;
    });

    fastify.post<{ Body: { agentId: string; triggeredBy?: string; initialState?: any } }>(
        '/executions',
        async (request, reply) => {
            const { agentId, triggeredBy, initialState } = request.body;
            const execution = new ExecutionRun({
                agentDefinitionId: agentId,
                triggeredBy,
                state: initialState || {},
                status: 'pending',
            });
            await execution.save();

            // Emit event
            eventBus.emit('agent.run.started', { executionId: execution._id, agentId });

            // Start flow execution in background
            FlowEngine.runExecution(execution._id.toString()).catch(console.error);

            return reply.code(201).send(execution);
        }
    );
};
