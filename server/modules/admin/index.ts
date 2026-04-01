import { FastifyInstance } from 'fastify';
import { registerUserHandlers } from './userHandlers';
import { registerAgentHandlers } from './agentHandlers';
import { registerBlogHandlers } from './blogHandlers';
import { registerSupportHandlers } from './supportHandlers';

export async function adminRoutes(fastify: FastifyInstance) {
    registerUserHandlers(fastify);
    registerAgentHandlers(fastify);
    registerBlogHandlers(fastify);
    registerSupportHandlers(fastify);
}
