import { FastifyInstance } from 'fastify';
import { blogRoutes as routes } from './blog.controller';

export async function blogRoutes(fastify: FastifyInstance) {
    await fastify.register(routes);
}
