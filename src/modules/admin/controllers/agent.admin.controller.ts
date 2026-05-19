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

}