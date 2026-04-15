import { FastifyInstance } from 'fastify';
import { toolsController } from './tools.controller';

export async function toolRoutes(fastify: FastifyInstance) {
    await toolsController(fastify);
}
