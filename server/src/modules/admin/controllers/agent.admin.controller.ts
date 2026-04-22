import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';
import {
    cookieAuthSecurity,
    agentSchema,
    executionSchema,
    standardErrorResponses,
} from '../../../shared/docs';

/**
 * AgentAdminHandlers: Global monitoring of AI agents and executions.
 */
export function registerAgentHandlers(fastify: FastifyInstance) {
    // GET /api/admin/agents — all published agents
    fastify.get('/agents', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List all published agents (Admin)',
            description: 'Returns a list of all agents currently published to the marketplace.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Published agents', type: 'array', items: agentSchema },
                ...standardErrorResponses([401, 403]),
            },
        },
    }, async () => AdminService.listPublishedAgents());

    // GET /api/admin/drafts — all draft agents
    fastify.get('/drafts', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List all draft agents (Admin)',
            description: 'Returns all agents currently in draft status across all users.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Draft agents', type: 'array', items: agentSchema },
                ...standardErrorResponses([401, 403]),
            },
        },
    }, async () => AdminService.listDraftAgents());

    // GET /api/admin/executions — all execution runs
    fastify.get<{ Querystring: { page?: string } }>('/executions', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List global executions (Admin)',
            description: 'Returns a paginated list of all agent execution runs across the entire platform.',
            security: [cookieAuthSecurity],
            querystring: {
                type: 'object',
                properties: { page: { type: 'string', default: '1' } },
            },
            response: {
                200: {
                    description: 'Global execution history',
                    type: 'object',
                    properties: {
                        executions: { type: 'array', items: executionSchema },
                        total: { type: 'number' },
                        pages: { type: 'number' },
                    },
                },
                ...standardErrorResponses([401, 403]),
            },
        },
    }, async (request) => {
        const page = parseInt(request.query.page ?? '1', 10);
        return AdminService.listExecutions(page);
    });
}
