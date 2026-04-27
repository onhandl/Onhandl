import { FastifyInstance } from 'fastify';
import { telegramAuthController } from './telegram.controller';

export async function telegramAuthRoutes(fastify: FastifyInstance) {
  await telegramAuthController(fastify);
}
