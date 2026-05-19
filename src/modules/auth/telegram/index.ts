import { FastifyInstance } from 'fastify';
import { telegramAuthController } from './telegram.controller';

export async function telegramAuthRoutes(fastify: FastifyInstance) {
  await telegramAuthController(fastify);
}

export * from './telegram.service';
export * from './telegram.repository';
export * from './telegram.types';
