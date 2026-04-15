import { FastifyPluginAsync } from 'fastify';
import { ReviewService } from './reviews.service';

export const reviewsController: FastifyPluginAsync = async (fastify) => {

    fastify.post<{ Params: { id: string }; Body: { rating: number; comment?: string } }>(
        '/agents/:id/reviews', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return reply.send(await ReviewService.submitReview(request.user.id, request.params.id, request.body.rating, request.body.comment));
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
        '/agents/:id/reviews',
        async (request) => {
            return ReviewService.listReviews(request.params.id, parseInt(request.query.page ?? '1'), parseInt(request.query.limit ?? '10'));
        }
    );

    fastify.get<{ Params: { id: string } }>(
        '/agents/:id/reviews/mine', { onRequest: [fastify.authenticate] },
        async (request) => {
            return ReviewService.getMyReview(request.user.id, request.params.id);
        }
    );
};
