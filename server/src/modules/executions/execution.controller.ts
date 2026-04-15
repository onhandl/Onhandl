import { FastifyInstance } from 'fastify';
import { Readable } from 'stream';
import { executionEmitter } from './execution.events';
import { ExecutionService } from './execution.service';

export async function executionController(fastify: FastifyInstance) {
    // ── Get execution ──────────────────────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            return await ExecutionService.getById(request.params.id);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
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
        return ExecutionService.list(request.query.agentId);
    });

    // ── Start execution ────────────────────────────────────────────────────────
    fastify.post<{ Body: { agentId: string; triggeredBy?: string; initialState?: any } }>(
        '/',
        async (request, reply) => {
            const { agentId, triggeredBy, initialState } = request.body;
            try {
                const execution = await ExecutionService.start(agentId, triggeredBy, initialState);
                return reply.code(201).send(execution);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // ── Node simulation ────────────────────────────────────────────────────────
    fastify.post<{ Body: any }>(
        '/simulate/node',
        async (request, reply) => {
            try {
                return await ExecutionService.simulateNode(request.body as any);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );
}
