import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';

export function registerAgentHandlers(fastify: FastifyInstance) {
    // GET /api/admin/agents — all published agents
    fastify.get('/agents', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listPublishedAgents();
    });

    // GET /api/admin/drafts — all draft agents
    fastify.get('/drafts', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listDraftAgents();
    });

    // GET /api/admin/marketplace — agents listed on marketplace
    fastify.get('/marketplace', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listMarketplaceAgents();
    });

    // GET /api/admin/executions — all execution runs
    fastify.get<{ Querystring: { page?: string } }>('/executions', { onRequest: [fastify.authorizeAdmin] }, async (request) => {
        const page = parseInt(request.query.page ?? '1', 10);
        return AdminService.listExecutions(page);
    });
}
