import { FastifyInstance } from 'fastify';
import { cookieAuthSecurity, standardErrorResponses } from '../../../shared/docs';
import { TelegramAuthService } from './telegram.service';

export async function telegramAuthController(fastify: FastifyInstance) {
    fastify.post<{ Body: { telegramUserId?: string; chatId?: string; username?: string; firstName?: string; lastName?: string } }>(
        '/telegram/verify',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Auth'],
                summary: 'Link Telegram account',
                security: [cookieAuthSecurity],
                body: {
                    type: 'object',
                    required: ['telegramUserId', 'chatId'],
                    properties: {
                        telegramUserId: { type: 'string' },
                        chatId: { type: 'string' },
                        username: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            linked: { type: 'boolean' },
                            telegram: { type: 'object', additionalProperties: true },
                        },
                    },
                    ...standardErrorResponses([400, 401, 409, 500]),
                },
            },
        },
        async (request, reply) => {
            try {
                return reply.send(await TelegramAuthService.verify(request.user.id, request.body as any));
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.get('/telegram/status', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Auth'],
            summary: 'Get Telegram link status',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        linked: { type: 'boolean' },
                        telegram: { type: ['object', 'null'], additionalProperties: true },
                        permissions: {
                            type: 'object',
                            properties: {
                                notifications: { type: 'boolean' },
                                write: { type: 'boolean' },
                            },
                        },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.send(await TelegramAuthService.status(request.user.id));
        } catch (e: any) {
            return reply.code(e.code || 500).send({ error: e.message });
        }
    });

    fastify.post('/telegram/unlink', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Auth'],
            summary: 'Unlink Telegram account',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.send(await TelegramAuthService.unlink(request.user.id));
        } catch (e: any) {
            return reply.code(e.code || 500).send({ error: e.message });
        }
    });

    fastify.get('/telegram/permissions', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Auth'],
            summary: 'Get Telegram permissions',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        notifications: { type: 'boolean' },
                        write: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.send(await TelegramAuthService.getPermissions(request.user.id));
        } catch (e: any) {
            return reply.code(e.code || 500).send({ error: e.message });
        }
    });

    fastify.patch<{ Body: { notifications?: boolean; write?: boolean } }>('/telegram/permissions', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Auth'],
            summary: 'Update Telegram permissions',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    notifications: { type: 'boolean' },
                    write: { type: 'boolean' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        permissions: {
                            type: 'object',
                            properties: {
                                notifications: { type: 'boolean' },
                                write: { type: 'boolean' },
                            },
                        },
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const body = request.body || {};
            if (body.notifications === undefined && body.write === undefined) {
                return reply.code(400).send({ error: 'At least one permission must be provided' });
            }
            return reply.send(await TelegramAuthService.updatePermissions(request.user.id, body));
        } catch (e: any) {
            return reply.code(e.code || 500).send({ error: e.message });
        }
    });
}
