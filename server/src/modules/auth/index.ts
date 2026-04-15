import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
    await authController(fastify);
}
