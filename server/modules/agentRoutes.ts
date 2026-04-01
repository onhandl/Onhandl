import { FastifyPluginAsync } from 'fastify';
import { readAgentRoutes } from './agents/readHandlers';
import { createAgentRoutes } from './agents/createHandlers';
import { updateAgentRoutes } from './agents/updateHandlers';

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(readAgentRoutes);
    await fastify.register(createAgentRoutes);
    await fastify.register(updateAgentRoutes);
};
