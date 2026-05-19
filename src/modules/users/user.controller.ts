import { FastifyInstance } from 'fastify';
import { UserService } from './user.service';
import {
    cookieAuthSecurity,
    standardErrorResponses,
    notificationSettingsSchema,
} from '../../shared/docs';

/**
 * UserController: Endpoints for user-specific settings like notifications,
 * payment methods, and AI provider API keys.
 */
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
                    ...notificationSettingsSchema,
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => UserService.getNotifications(request.user.id));

    fastify.put<{ Body: { telegram?: boolean; whatsapp?: boolean; dailySummaries?: boolean; email?: boolean } }>(
        '/notifications', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update notification preferences',
            description: 'Updates the notification channel settings for the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                ...notificationSettingsSchema,
            },
            response: {
                200: {
                    description: 'Updated preferences',
                    ...notificationSettingsSchema,
                },
                ...standardErrorResponses([401, 400, 500]),
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
            description: 'Returns saved crypto wallet configurations for the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'Payment methods',
                    type: 'object',
                    properties: {
                        crypto: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    network: { type: 'string' },
                                    walletAddress: { type: 'string' },
                                    asset: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => UserService.getPaymentMethods(request.user.id));

    fastify.put<{ Body: { crypto?: Array<{ label: string; network: string; walletAddress: string; asset: string }> } }>(
        '/payment-methods', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update payment methods',
            description: 'Updates saved crypto wallet configurations for the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    crypto: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string' },
                                network: { type: 'string' },
                                walletAddress: { type: 'string' },
                                asset: { type: 'string' },
                            },
                        },
                    },
                },
            },
            response: {
                200: {
                    description: 'Updated payment methods successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401, 400, 500]),
            },
        },
    },
        async (request) => {
            await UserService.updatePaymentMethods(request.user.id, request.body.crypto);
            return { success: true };
        }
    );

    // ── AI provider keys ────────────────────────────────────────────────────
    fastify.get('/api-keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Get AI provider API keys',
            description: 'Returns configured AI provider keys (Gemini, OpenAI, Ollama). Keys are partially masked.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'AI provider keys',
                    type: 'object',
                    properties: {
                        gemini: { type: 'string' },
                        openai: { type: 'string' },
                        openaiBaseUrl: { type: 'string' },
                        openaiModel: { type: 'string' },
                        ollamaBaseUrl: { type: 'string' },
                        ollamaModel: { type: 'string' },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => UserService.getApiKeys(request.user.id));

    fastify.put<{ Body: { gemini?: string; openai?: string; openaiBaseUrl?: string; openaiModel?: string; ollamaBaseUrl?: string; ollamaModel?: string } }>(
        '/api-keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update AI provider API keys',
            description: 'Saves or updates AI provider keys used during agent execution. Keys are encrypted at rest.',
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
                200: {
                    description: 'Updated provider keys successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401, 400, 500]),
            },
        },
    },
        async (request) => {
            await UserService.updateApiKeys(request.user.id, request.body);
            return { success: true };
        }
    );
}
