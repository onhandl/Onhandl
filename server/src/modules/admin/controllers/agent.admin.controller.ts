import { FastifyInstance } from 'fastify';
import { AgentDefinition } from '../../../infrastructure/database/models/AgentDefinition';
import { ExecutionRun } from '../../../infrastructure/database/models/ExecutionRun';
import { requireAdmin } from '../admin.middleware';

export function registerAgentHandlers(fastify: FastifyInstance) {
    // GET /api/admin/agents — all published agents
    fastify.get('/agents', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const agents = await AgentDefinition.find({ isDraft: false })
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(agents);
    });

    // GET /api/admin/drafts — all draft agents
    fastify.get('/drafts', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const drafts = await AgentDefinition.find({ isDraft: true })
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(drafts);
    });

    // GET /api/admin/marketplace — agents listed on marketplace
    fastify.get('/marketplace', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const agents = await AgentDefinition.find({
            'marketplace.isListed': true,
        }).sort({ createdAt: -1 }).lean();
        return reply.send(agents);
    });

    // GET /api/admin/executions — all execution runs
    fastify.get('/executions', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const page = parseInt(request.query.page ?? '1', 10);
        const limit = 50;
        const runs = await ExecutionRun.find()
            .sort({ startedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const total = await ExecutionRun.countDocuments();
        return reply.send({ runs, total, page });
    });
}
