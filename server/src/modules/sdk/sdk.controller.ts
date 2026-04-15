import { FastifyInstance } from 'fastify';
import { OnhandlSDKInternal } from '../../sdk/onhandl-sdk-internal';
import { assertScope } from '../../shared/utils/permissions';
import { bearerAuthSecurity, executionIdParamSchema, executionSchema, standardErrorResponses } from '../../shared/docs';

const sdkErrorResponses = () => standardErrorResponses([401, 403, 429, 500]);

export async function sdkRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', fastify.authenticateApiKey);
    fastify.addHook('preHandler', async (request, reply) => {
        await fastify.rateLimit(request, reply, { limit: 60, windowMs: 60000, category: 'sdk_api' });
    });

    fastify.get<{ Params: { id: string } }>('/executions/:id', {
        schema: {
            tags: ['SDK'],
            summary: 'Get execution by ID',
            description: 'Returns details for a specific execution. Requires `executions:read` scope.',
            security: [bearerAuthSecurity],
            params: executionIdParamSchema(),
            response: {
                200: { description: 'Execution details', ...executionSchema },
                ...sdkErrorResponses(),
            },
        },
    }, async (request, reply) => {
        try {
            assertScope(request.apiKeyAuth!, 'executions:read');
            return await OnhandlSDKInternal.getExecution(request.params.id, request.apiKeyAuth!);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.get<{ Querystring: { agentId?: string } }>('/executions', {
        schema: {
            tags: ['SDK'],
            summary: 'List executions',
            description: 'Lists all executions scoped to the API key\'s workspace. Optionally filtered by agentId. Requires `executions:read` scope.',
            security: [bearerAuthSecurity],
            querystring: {
                type: 'object',
                properties: { agentId: { type: 'string', description: 'Filter by agent ID' } },
            },
            response: {
                200: { description: 'Execution list', type: 'array', items: executionSchema },
                ...sdkErrorResponses(),
            },
        },
    }, async (request, reply) => {
        try {
            assertScope(request.apiKeyAuth!, 'executions:read');
            return OnhandlSDKInternal.listExecutions(request.query.agentId, request.apiKeyAuth!);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Body: { agentId: string; initialState?: any } }>('/executions/start', {
        schema: {
            tags: ['SDK'],
            summary: 'Start a new execution',
            description: 'Creates and queues a new execution for the specified agent. Requires `executions:write` scope.',
            security: [bearerAuthSecurity],
            body: {
                type: 'object',
                required: ['agentId'],
                properties: {
                    agentId: { type: 'string', description: 'Agent ID to execute' },
                    initialState: { type: 'object', additionalProperties: true },
                },
            },
            response: {
                200: { description: 'Execution created', ...executionSchema },
                ...sdkErrorResponses(),
            },
        },
    }, async (request, reply) => {
        try {
            assertScope(request.apiKeyAuth!, 'executions:write');
            return await OnhandlSDKInternal.startExecution(request.body.agentId, request.apiKeyAuth!, request.body.initialState);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Params: { id: string } }>('/executions/:id/run', {
        schema: {
            tags: ['SDK'],
            summary: 'Run an execution',
            description: 'Triggers the orchestration engine to process a queued execution. Requires `executions:write` scope.',
            security: [bearerAuthSecurity],
            params: executionIdParamSchema(),
            response: {
                200: { description: 'Execution queued', type: 'object', properties: { message: { type: 'string' } } },
                ...sdkErrorResponses(),
            },
        },
    }, async (request, reply) => {
        try {
            assertScope(request.apiKeyAuth!, 'executions:write');
            await OnhandlSDKInternal.runExecution(request.params.id, request.apiKeyAuth!);
            return { message: 'Execution started' };
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post('/executions/simulate-node', {
        schema: {
            tags: ['SDK'],
            summary: 'Simulate a single node',
            description: 'Executes a single node in isolation. Useful for debugging. Requires `sdk:simulate` scope.',
            security: [bearerAuthSecurity],
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
                200: { description: 'Simulation result', type: 'object', additionalProperties: true },
                ...sdkErrorResponses(),
            },
        },
    }, async (request, reply) => {
        try {
            assertScope(request.apiKeyAuth!, 'sdk:simulate');
            return await OnhandlSDKInternal.simulateNode(request.body as any, request.apiKeyAuth!);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
