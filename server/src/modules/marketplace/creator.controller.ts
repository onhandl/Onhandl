import { FastifyInstance } from 'fastify';
import { MarketplaceService } from './marketplace.service';
import { cookieAuthSecurity, standardErrorResponses } from '../../shared/docs';

export async function creatorController(fastify: FastifyInstance) {
    fastify.get<{ Params: { username: string } }>('/creator/:username', {
        schema: {
            tags: ['Creator'],
            summary: 'Get creator public profile',
            description: 'Returns the public profile for a marketplace creator.',
            params: {
                type: 'object',
                required: ['username'],
                properties: { username: { type: 'string', description: 'Creator username' } },
            },
            response: {
                200: { description: 'Creator profile', type: 'object', additionalProperties: true },
                ...standardErrorResponses([404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await MarketplaceService.getCreatorProfile(request.params.username); }
        catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.get('/creator/me/stats', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Creator'],
            summary: 'Get my creator stats',
            description: 'Returns marketplace performance stats (views, purchases, revenue) for the authenticated creator.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Creator stats', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await MarketplaceService.getMyStats(request.user.id); }
        catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.put<{ Body: { displayName?: string; avatar?: string; bio?: string; links?: string[] } }>(
        '/creator/me/profile', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Creator'],
            summary: 'Update my creator profile',
            description: 'Updates the authenticated user\'s public creator profile fields.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    displayName: { type: 'string' },
                    avatar: { type: 'string' },
                    bio: { type: 'string' },
                    links: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                200: { description: 'Updated creator profile', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await MarketplaceService.updateMyProfile(request.user.id, request.body); }
            catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );
}
