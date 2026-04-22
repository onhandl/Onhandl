import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';

export async function registerOpenApi(fastify: FastifyInstance) {
    await fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Onhandl API',
                version: '1.0.0',
                description: `
                        Onhandl API — Build, deploy, run, and monetize AI agents programmatically.
        `.trim(),
            },
            servers: [
                { url: '/api', description: 'Primary API' },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'auth_token',
                        description: 'HTTP-only cookie set on login. Used for all app/browser routes.',
                    },
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'Developer API Key',
                        description: 'Developer API key prefixed with onhandl_. Used for SDK and programmatic routes.',
                    },
                },
            },
            security: [],
        },
    });
}