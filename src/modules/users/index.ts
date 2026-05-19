import { FastifyInstance } from 'fastify';
import { userController } from './user.controller';

export async function userRoutes(fastify: FastifyInstance) {
    await userController(fastify);
}
