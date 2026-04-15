import { FastifyInstance } from 'fastify';
import { ReviewService as ReviewsService } from './reviews.service';
import { cookieAuthSecurity, idParamSchema, reviewSchema, standardErrorResponses } from '../../shared/docs';

export async function reviewsController(fastify: FastifyInstance) {
    fastify.post<{ Params: { agentId: string }; Body: { rating: number; comment?: string } }>(
        '/reviews/:agentId', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Reviews'],
            summary: 'Submit a review',
            description: 'Submits a review for a marketplace agent. Requires the user to have purchased or used the agent.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            body: {
                type: 'object',
                required: ['rating'],
                properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string' },
                },
            },
            response: {
                201: { description: 'Review created', ...reviewSchema },
                ...standardErrorResponses([400, 401, 403, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const review = await ReviewsService.submitReview(request.params.agentId, request.user.id, request.body.rating, request.body.comment);
                return reply.code(201).send(review);
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    fastify.get<{ Params: { agentId: string } }>('/reviews/:agentId', {
        schema: {
            tags: ['Reviews'],
            summary: 'List reviews for an agent',
            description: 'Returns all visible reviews for the specified marketplace agent.',
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'Reviews list', type: 'array', items: reviewSchema },
                ...standardErrorResponses([404]),
            },
        },
    }, async (request, reply) => {
        try { return await ReviewsService.listReviews(request.params.agentId, 1, 50); }
        catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });

    fastify.get('/reviews/mine', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Reviews'],
            summary: 'Get my reviews',
            description: 'Returns all reviews submitted by the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'My reviews', type: 'array', items: reviewSchema },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request, reply) => {
        try { return await ReviewsService.getMyReview(request.user.id, ''); }
        catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
    });
}
