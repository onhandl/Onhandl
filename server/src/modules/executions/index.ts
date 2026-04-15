import { FastifyInstance } from 'fastify';
import { executionController } from './execution.controller';

export async function executionRoutes(fastify: FastifyInstance) {
    await executionController(fastify);
}
