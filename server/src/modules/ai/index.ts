import { FastifyInstance } from 'fastify';
import { aiRoutes as routes } from './ai.controller';

export async function aiRoutes(fastify: FastifyInstance) {
    await fastify.register(routes);
}
