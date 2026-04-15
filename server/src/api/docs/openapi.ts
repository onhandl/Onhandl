import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';

export async function registerOpenApi(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Onhandl API',
        description: 'Onhandl platform API reference',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/api',
          description: 'Primary API',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'auth_token',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key / JWT',
          },
        },
      },
      security: [],
      tags: [
        { name: 'Auth' },
        { name: 'Users' },
        { name: 'Agents' },
        { name: 'Executions' },
        { name: 'Marketplace' },
        { name: 'Payments' },
        { name: 'Developer API Keys' },
        { name: 'SDK' },
      ],
    },
  });
}