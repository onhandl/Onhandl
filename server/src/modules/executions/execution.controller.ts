import { FastifyInstance } from 'fastify';
import { Readable } from 'stream';
import { executionEmitter } from './execution.events';
import { OnhandlSDKInternal } from '../../sdk/onhandl-sdk-internal';
import {
    cookieAuthSecurity, executionIdParamSchema,
    executionSchema, standardErrorResponses,
} from '../../shared/docs';

export async function executionController(fastify: FastifyInstance) {

    fastify.get<{ Params: { id: string } }>('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Executions'],
            summary: 'Get execution by ID',
            description: 'Returns the details of a specific execution. The authenticated user must own the execution or its associated workspace.',
            security: [cookieAuthSecurity],
            params: executionIdParamSchema(),
            response: {
                200: { description: 'Execution details', ...executionSchema },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return await OnhandlSDKInternal.getExecution(request.params.id, { userId: request.user.id, type: 'user' });
        } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.get<{ Params: { id: string } }>('/:id/stream', {
        schema: {
            tags: ['Executions'],
            summary: 'Stream execution events (SSE)',
            description: 'Opens a Server-Sent Events stream for real-time execution progress. Emits node-level events as the agent runs. Closes when execution completes or fails.',
            params: executionIdParamSchema(),
            response: { 200: { description: 'SSE stream (text/event-stream)', type: 'string' } },
        },
    }, (request, reply) => {
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
        request.raw.on('close', () => { executionEmitter.removeListener(`execution-${id}`, listener); stream.destroy(); });
        return reply
            .header('Content-Type', 'text/event-stream').header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive').header('Access-Control-Allow-Origin', origin)
            .header('Access-Control-Allow-Credentials', 'true').send(stream);
    });

    fastify.get<{ Querystring: { agentId: string } }>('/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Executions'],
            summary: 'List executions',
            description: 'Returns all executions for the authenticated user, optionally filtered by agent ID.',
            security: [cookieAuthSecurity],
            querystring: {
                type: 'object',
                properties: { agentId: { type: 'string', description: 'Filter by agent ID' } },
            },
            response: {
                200: { description: 'Execution list', type: 'array', items: executionSchema },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => OnhandlSDKInternal.listExecutions(request.query.agentId, { userId: request.user.id, type: 'user' }));

    fastify.post<{ Body: { agentId: string; initialState?: any } }>(
        '/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Executions'],
            summary: 'Start a new execution',
            description: 'Creates and queues a new execution for the given agent. Token costs may apply.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['agentId'],
                properties: {
                    agentId: { type: 'string', description: 'Agent ID to execute' },
                    initialState: { type: 'object', additionalProperties: true, description: 'Optional initial flow state' },
                },
            },
            response: {
                201: { description: 'Execution created', ...executionSchema },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const execution = await OnhandlSDKInternal.startExecution(request.body.agentId, { userId: request.user.id, type: 'user' }, request.body.initialState);
                return reply.code(201).send(execution);
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    fastify.post<{ Body: any }>('/simulate/node', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Executions'],
            summary: 'Simulate a single node',
            description: 'Executes a single node in isolation without running a full flow. Useful for debugging individual agent nodes.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    node: { type: 'object', additionalProperties: true },
                    nodeType: { type: 'string' },
                    inputValues: { type: 'object', additionalProperties: true },
                    agentId: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Simulation output', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return await OnhandlSDKInternal.simulateNode(request.body as any, { userId: request.user.id, type: 'user' });
        } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.post<{ Params: { id: string } }>('/:id/run', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Executions'],
            summary: 'Run an execution',
            description: 'Triggers the orchestration engine to process a previously created execution.',
            security: [cookieAuthSecurity],
            params: executionIdParamSchema(),
            response: {
                200: { description: 'Execution started', type: 'object', properties: { message: { type: 'string' } } },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            await OnhandlSDKInternal.runExecution(request.params.id, { userId: request.user.id, type: 'user' });
            return { message: 'Execution started' };
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
