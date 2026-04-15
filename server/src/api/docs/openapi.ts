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
            tags: [
                { name: 'Auth', description: 'Registration, login, logout, and profile access' },
                { name: 'Users', description: 'Notification preferences, API keys, payment methods' },
                { name: 'Agents', description: 'Agent CRUD, templates, persona, graph management' },
                { name: 'Executions', description: 'Start, run, inspect, and simulate agent executions' },
                { name: 'Marketplace', description: 'Browse, publish, purchase, and review marketplace agents' },
                { name: 'Creator', description: 'Creator profiles and marketplace dashboard stats' },
                { name: 'Reviews', description: 'Agent reviews and ratings' },
                { name: 'Payments', description: 'Stripe and crypto payment processing' },
                { name: 'Developer API Keys', description: 'Create and manage developer API keys for SDK access' },
                { name: 'SDK', description: 'Programmatic agent execution via developer API keys' },
                { name: 'AI', description: 'AI inference and generation utilities' },
                { name: 'Bots', description: 'Bot integrations for agents' },
                { name: 'Blog', description: 'Platform blog content' },
                { name: 'Support', description: 'User support tickets and admin support management' },
                { name: 'Workspaces', description: 'Workspace management and membership' },
                { name: 'Tools', description: 'Available node tools and blockchain tools' },
                { name: 'Admin', description: 'Admin-only management endpoints' },
                { name: 'MCP', description: 'Model Context Protocol integration endpoints' },
            ],
        },
    });
}