import { FastifyInstance } from 'fastify';
import apiReference from '@scalar/fastify-api-reference';

export async function registerScalarDocs(fastify: FastifyInstance) {
  await fastify.register(apiReference, {
    routePrefix: '/api/docs',
    configuration: {
      title: 'Onhandl API Docs',
      theme: 'purple',
      url: '/openapi.json',
    },
  });

  fastify.get('/openapi.json', async () => {
    return fastify.swagger();
  });
}