import { FastifyInstance } from 'fastify';
import { marketplaceRoutes as routes } from './marketplace.controller';

export async function marketplaceRoutes(fastify: FastifyInstance) {
    await fastify.register(routes);
}
