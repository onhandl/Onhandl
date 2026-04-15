import { FastifyPluginAsync } from 'fastify';
import { MarketplaceService } from './marketplace.service';

export const creatorsController: FastifyPluginAsync = async (fastify) => {
    // Public profile — no auth required (views incremented unless owner)
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            return await MarketplaceService.getCreatorProfile(request.params.id, request.user?.id);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // My stats
    fastify.get(
        '/me/stats',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await MarketplaceService.getMyStats(request.user.id);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // Update profile
    fastify.put<{ Body: { bio?: string; avatarUrl?: string; name?: string } }>(
        '/me',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await MarketplaceService.updateMyProfile(request.user.id, request.body);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );
};
