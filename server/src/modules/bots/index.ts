import { FastifyInstance } from 'fastify';
import { botsController } from './bots.controller';

export async function botRoutes(fastify: FastifyInstance) {
    await botsController(fastify);
}
