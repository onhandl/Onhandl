import { FastifyPluginAsync } from 'fastify';
import { MarketplaceService } from './marketplace.service';

export const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
    // ── List published agents ─────────────────────────────────────────────────
    fastify.get<{
        Querystring: {
            category?: string;
            pricing?: 'free' | 'paid' | 'all';
            network?: string;
            search?: string;
            page?: string;
            limit?: string;
        };
    }>('/marketplace', async (request) => {
        return MarketplaceService.listAgents(request.query);
    });

    // ── Get single marketplace agent ──────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/marketplace/:id', async (request, reply) => {
        try {
            return await MarketplaceService.getAgent(request.params.id);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // ── Publish / update marketplace listing ──────────────────────────────────
    fastify.post<{
        Params: { id: string };
        Body: any;
    }>(
        '/marketplace/:id/publish',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await MarketplaceService.publishListing(request.params.id, request.user.id, request.body);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // ── Use a free marketplace agent → creates a proxy agent for the buyer ───
    fastify.post<{ Params: { id: string } }>(
        '/marketplace/:id/use',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await MarketplaceService.useFreeAgent(request.params.id, request.user.id);
            } catch (err: any) {
                if (err.code === 409) {
                    return reply.code(409).send({ error: err.message, proxyAgentId: err.proxyAgentId });
                }
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // ── Fiber / multi-chain purchase ──────────────────────────────────────────
    fastify.post<{ Params: { id: string }; Body: { network: string; txHash?: string } }>(
        '/marketplace/:id/network-purchase',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await MarketplaceService.initiateNetworkPurchase(request.params.id, request.user.id, request.body);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // ── Purchase history for buyer ────────────────────────────────────────────
    fastify.get(
        '/marketplace/purchases/mine',
        { onRequest: [fastify.authenticate] },
        async (request) => {
            return MarketplaceService.getMyPurchases(request.user.id);
        }
    );
};
