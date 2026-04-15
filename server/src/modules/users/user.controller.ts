import { FastifyInstance } from 'fastify';
import { UserService } from './user.service';
import { cookieAuthSecurity, standardErrorResponses } from '../../shared/docs';

export async function userController(fastify: FastifyInstance) {
    // ── Notifications ────────────────────────────────────────────────────────
    fastify.get('/notifications', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Get notification preferences',
            description: 'Returns the current notification settings for the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'Notification preferences',
                    type: 'object',
                    properties: {
                        telegram: { type: 'boolean' },
                        dailySummaries: { type: 'boolean' },
                        email: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => UserService.getNotifications(request.user.id));

    fastify.put<{ Body: { telegram?: boolean; dailySummaries?: boolean; email?: boolean } }>(
        '/notifications', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update notification preferences',
            description: 'Updates the notification channel settings for the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    telegram: { type: 'boolean' },
                    dailySummaries: { type: 'boolean' },
                    email: { type: 'boolean' },
                },
            },
            response: {
                200: { description: 'Updated preferences', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    },
        async (request) => UserService.updateNotifications(request.user.id, request.body)
    );

    // ── Payment methods ─────────────────────────────────────────────────────
    fastify.get('/payment-methods', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Get payment methods',
            description: 'Returns saved Stripe and crypto wallet configurations for the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Payment methods', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => UserService.getPaymentMethods(request.user.id));

    fastify.put<{ Body: { stripe?: { enabled: boolean }; crypto?: Array<{ label: string; network: string; walletAddress: string; asset: string }> } }>(
        '/payment-methods', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update payment methods',
            description: 'Updates Stripe account and crypto wallet configurations for the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    stripe: { type: 'object', properties: { enabled: { type: 'boolean' } } },
                    crypto: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string' }, network: { type: 'string' },
                                walletAddress: { type: 'string' }, asset: { type: 'string' },
                            },
                        },
                    },
                },
            },
            response: {
                200: { description: 'Updated payment methods', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    },
        async (request) => UserService.updatePaymentMethods(request.user.id, request.body.stripe, request.body.crypto)
    );

    // ── AI provider keys ────────────────────────────────────────────────────
    fastify.get('/api-keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Get AI provider API keys',
            description: 'Returns configured AI provider keys (Gemini, OpenAI, Ollama). Keys are stored encrypted.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'AI provider keys', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => UserService.getApiKeys(request.user.id));

    fastify.put<{ Body: { gemini?: string; openai?: string; openaiBaseUrl?: string; openaiModel?: string; ollamaBaseUrl?: string; ollamaModel?: string } }>(
        '/api-keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update AI provider API keys',
            description: 'Saves or updates AI provider keys used during agent execution.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    gemini: { type: 'string', description: 'Google Gemini API key' },
                    openai: { type: 'string', description: 'OpenAI API key' },
                    openaiBaseUrl: { type: 'string', description: 'Custom OpenAI-compatible base URL' },
                    openaiModel: { type: 'string', description: 'Default OpenAI model name' },
                    ollamaBaseUrl: { type: 'string', description: 'Ollama server base URL' },
                    ollamaModel: { type: 'string', description: 'Default Ollama model name' },
                },
            },
            response: {
                200: { description: 'Updated provider keys', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    },
        async (request) => UserService.updateApiKeys(request.user.id, request.body)
    );
}
