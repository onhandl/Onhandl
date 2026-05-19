import { FastifyInstance } from 'fastify';
import { terminalAuthController } from './terminal-auth.controller';

export async function terminalAuthRoutes(fastify: FastifyInstance) {
    await terminalAuthController(fastify);
}
