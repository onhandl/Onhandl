import { FastifyInstance } from 'fastify';
import { paymentRoutes as routes } from './payment.controller';
import { paymentLinkRoutes } from './payment-link.controller';

export async function paymentRoutes(fastify: FastifyInstance) {
    await fastify.register(routes);
    await fastify.register(paymentLinkRoutes);
}
