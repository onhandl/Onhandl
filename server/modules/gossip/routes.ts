import { FastifyPluginAsync } from 'fastify';
import {
    getCatalogs,
    listSubscriptions,
    getSubscription,
    subscribe,
    unsubscribe,
    checkCompatibility,
} from './handlers';

export const gossipRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/catalogs',                  getCatalogs);
    fastify.get('/subscriptions',             listSubscriptions);
    fastify.get('/subscriptions/:agentId',    getSubscription);
    fastify.post('/subscribe',                subscribe);
    fastify.delete('/subscriptions/:agentId', unsubscribe);
    fastify.post('/check-compatibility',      checkCompatibility);
};
