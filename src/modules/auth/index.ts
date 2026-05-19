import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';
import { telegramAuthRoutes } from './telegram';

export async function authRoutes(fastify: FastifyInstance) {
    await authController(fastify);
    await telegramAuthRoutes(fastify);
}
