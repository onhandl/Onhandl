import { FastifyPluginAsync } from 'fastify';
import { TerminalOpsController } from './terminal-ops.controller';
import {
    idParamSchema,
    agentSchema,
    executionSchema,
    standardErrorResponses,
} from '../../shared/docs';

/**
 * TerminalOpsRoutes: Specialized operational endpoints for the Onhandl Terminal
 * and CLI tools. These routes use specialized terminal authentication.
 */
export const terminalOpsRoutes: FastifyPluginAsync = async (fastify) => {
    // Apply terminal authentication to all operational routes
    fastify.addHook('onRequest', fastify.authenticateTerminal);

    // GET /terminal/me - Current user profile for terminal
    fastify.get('/me', {
        schema: {
            tags: ['Terminal Operations'],
            summary: 'Get current terminal user profile',
            description: 'Returns profile of the authenticated terminal user.',
            response: {
                200: {
                    description: 'User profile',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        plan: { type: 'string' },
                        tokens: { type: 'number' },
                        workspaceId: { type: 'string' },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, TerminalOpsController.getMe);

    // GET /terminal/agents - List available agents for CLI

    fastify.get('/agents', {
        schema: {
            tags: ['Terminal Operations'],
            summary: 'List agents for terminal',
            description: 'Returns published agents accessible to the authorized terminal device.',
            response: {
                200: {
                    description: 'List of agents',
                    type: 'object',
                    required: ['agents'],
                    properties: {
                        agents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    agentType: { type: 'string' },
                                    isDraft: { type: 'boolean' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, TerminalOpsController.listAgents);

    // POST /terminal/executions - Start agent from CLI
    fastify.post('/executions', {
        schema: {
            tags: ['Terminal Operations'],
            summary: 'Start agent execution from terminal',
            description: 'Triggers a new execution for the specified agent. Returns execution ID for tracking.',
            body: {
                type: 'object',
                required: ['agentId'],
                properties: {
                    agentId: { type: 'string' },
                    initialState: { type: 'object', additionalProperties: true },
                },
            },
            response: {
                200: {
                    description: 'Execution started',
                    type: 'object',
                    properties: {
                        executionId: { type: 'string' },
                        status: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, TerminalOpsController.startExecution);

    // GET /terminal/executions/:executionId/watch - SSE logs for CLI
    fastify.get('/executions/:executionId/watch', {
        schema: {
            tags: ['Terminal Operations'],
            summary: 'Watch execution logs',
            description: 'Streams real-time execution events specifically formatted for terminal consumption.',
            params: {
                type: 'object',
                required: ['executionId'],
                properties: {
                    executionId: { type: 'string' },
                },
            },
            response: {
                200: {
                    description: 'Event stream',
                    type: 'string',
                    content: { 'text/event-stream': { schema: { type: 'string' } } },
                },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    }, TerminalOpsController.watchExecution);

    // POST /terminal/agents/:agentId/chat - Direct CLI chat
    fastify.post('/agents/:agentId/chat', {
        schema: {
            tags: ['Terminal Operations'],
            summary: 'Chat with agent from terminal',
            description: 'Streams AI agent responses directly for CLI display.',
            params: {
                type: 'object',
                required: ['agentId'],
                properties: {
                    agentId: { type: 'string', description: 'Agent ID' },
                },
            },
            body: {
                type: 'object',
                required: ['messages'],
                properties: {
                    messages: { type: 'array', items: { type: 'object', additionalProperties: true } },
                },
            },
            response: {
                200: {
                    description: 'Event stream of messages',
                    type: 'string',
                    content: { 'text/event-stream': { schema: { type: 'string' } } },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, TerminalOpsController.chatStream);
};
