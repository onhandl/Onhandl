import { FastifyInstance } from 'fastify';
import { paymentRoutes as routes } from './payment.controller';

export async function paymentRoutes(fastify: FastifyInstance) {
    await fastify.register(routes);
}
