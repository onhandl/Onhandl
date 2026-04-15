import { FastifyInstance } from 'fastify';
import { MarketplaceService } from './marketplace.service';
import {
    cookieAuthSecurity, idParamSchema, paginatedSearchQuerySchema, standardErrorResponses,
} from '../../shared/docs';

export const marketplaceRoutes = async (fastify: FastifyInstance) => {
    fastify.get<{ Querystring: { category?: string; pricing?: string; network?: string; search?: string; page?: string; limit?: string } }>('/marketplace', {
        schema: {
            tags: ['Marketplace'],
            summary: 'List published marketplace agents',
            description: 'Returns a paginated list of publicly published agents. Available to all users including unauthenticated visitors.',
            querystring: {
                type: 'object',
                properties: {
                    ...paginatedSearchQuerySchema.properties,
                    category: { type: 'string', description: 'Filter by category' },
                    pricing: { type: 'string', enum: ['free', 'paid', 'all'], default: 'all' },
                    network: { type: 'string', description: 'Filter by blockchain network' },
                },
            },
            response: {
                200: {
                    description: 'Paginated marketplace agents',
                    type: 'object',
                    properties: {
                        agents: { type: 'array', items: { type: 'object', additionalProperties: true } },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                    },
                },
            },
        },
    }, async (request) => MarketplaceService.listAgents(request.query as any));

    fastify.get<{ Params: { id: string } }>('/marketplace/:id', {
        schema: {
            tags: ['Marketplace'],
            summary: 'Get marketplace agent details',
            description: 'Returns full details for a published marketplace agent including creator profile. View count is incremented on each call.',
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'Agent details with creator info', type: 'object', additionalProperties: true },
                ...standardErrorResponses([404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await MarketplaceService.getAgent(request.params.id); }
        catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.post<{ Params: { id: string }; Body: any }>(
        '/marketplace/:id/publish', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Marketplace'],
            summary: 'Publish agent to marketplace',
            description: 'Lists or updates an agent\'s marketplace listing. **Plan restriction**: Starter plan or above required.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            body: {
                type: 'object',
                properties: {
                    published: { type: 'boolean', default: true },
                    category: { type: 'string' },
                    visibility: { type: 'string', enum: ['public', 'private'], default: 'public' },
                    pricing: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['free', 'paid'] },
                            price: { type: 'number' },
                            currency: { type: 'string', default: 'USD' },
                        },
                    },
                },
            },
            response: {
                200: { description: 'Listing updated', type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 403, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await MarketplaceService.publishListing(request.params.id, request.user.id, request.body); }
            catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    fastify.post<{ Params: { id: string } }>(
        '/marketplace/:id/use', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Marketplace'],
            summary: 'Use (copy) a free marketplace agent',
            description: 'Creates a copy of a free marketplace agent in the user\'s workspace. Returns 409 if user already has a copy.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Marketplace agent ID'),
            response: {
                200: { description: 'Agent copy created', type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 409, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await MarketplaceService.useFreeAgent(request.params.id, request.user.id); }
            catch (err: any) {
                if (err.code === 409) return reply.code(409).send({ error: err.message, proxyAgentId: err.proxyAgentId });
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    fastify.post<{ Params: { id: string }; Body: { network: string; txHash?: string } }>(
        '/marketplace/:id/network-purchase', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Marketplace'],
            summary: 'Initiate crypto purchase',
            description: 'Initiates a crypto payment for a paid marketplace agent on the specified blockchain network.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Marketplace agent ID'),
            body: {
                type: 'object',
                required: ['network'],
                properties: {
                    network: { type: 'string', description: 'Blockchain network (e.g. ethereum)' },
                    txHash: { type: 'string', description: 'Optional tx hash if already submitted' },
                },
            },
            response: {
                200: { description: 'Purchase initiated', type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await MarketplaceService.initiateNetworkPurchase(request.params.id, request.user.id, request.body); }
            catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    fastify.get('/marketplace/purchases/mine', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Marketplace'],
            summary: 'Get my purchase history',
            description: 'Returns the authenticated user\'s marketplace purchase history.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Purchase list', type: 'array', items: { type: 'object', additionalProperties: true } },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => MarketplaceService.getMyPurchases(request.user.id));
};
