import { FastifyInstance } from 'fastify';
import { workspaceController } from './workspace.controller';

export async function workspaceRoutes(fastify: FastifyInstance) {
    await workspaceController(fastify);
}
