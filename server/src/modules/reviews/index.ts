import { FastifyInstance } from 'fastify';
import { reviewsController } from './reviews.controller';

export async function reviewRoutes(fastify: FastifyInstance) {
    await fastify.register(reviewsController);
}
