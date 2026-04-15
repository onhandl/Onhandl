import { FastifyInstance } from 'fastify';
import { registerUserHandlers } from './controllers/user.admin.controller';
import { registerAgentHandlers } from './controllers/agent.admin.controller';
import { registerBlogHandlers } from './controllers/blog.admin.controller';
import { registerSupportHandlers } from './controllers/support.admin.controller';

export async function adminRoutes(fastify: FastifyInstance) {
    registerUserHandlers(fastify);
    registerAgentHandlers(fastify);
    registerBlogHandlers(fastify);
    registerSupportHandlers(fastify);
}
