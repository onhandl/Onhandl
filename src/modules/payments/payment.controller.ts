import { FastifyPluginAsync } from 'fastify';
import { CRYPTO_NETWORKS } from './payment.service';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {

    fastify.get('/crypto/networks', {
        schema: {
            tags: ['Payments'],
            summary: 'List supported crypto networks',
            description: 'Returns all supported blockchain networks available for crypto payments.',
            response: {
                200: {
                    description: 'Supported networks',
                    type: 'array',
                    items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                },
            },
        },
    }, async () => CRYPTO_NETWORKS);
};
