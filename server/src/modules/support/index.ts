import { FastifyInstance } from 'fastify';
import { supportController } from './support.controller';

export async function supportRoutes(fastify: FastifyInstance) {
    await supportController(fastify);
}
