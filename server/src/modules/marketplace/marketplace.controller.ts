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
};
