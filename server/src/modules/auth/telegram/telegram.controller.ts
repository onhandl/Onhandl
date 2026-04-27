import { FastifyInstance } from 'fastify';
import { cookieAuthSecurity, standardErrorResponses } from '../../../shared/docs';
import { TelegramAuthService } from './telegram.service';

export async function telegramAuthController(fastify: FastifyInstance) {
  TelegramAuthService.startWebhook();

  fastify.post<{ Body: { code: string } }>(
    '/telegram/verify',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Verify Telegram OTP',
        description: 'Verifies a 6-digit code from Telegram and binds Telegram identity to the authenticated user.',
        security: [cookieAuthSecurity],
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', pattern: '^\\d{6}$' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              telegram: {
                type: 'object',
                properties: {
                  linked: { type: 'boolean' },
                  username: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  linkedAt: { type: 'string', format: 'date-time' },
                  lastAuthAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          ...standardErrorResponses([400, 401, 409, 429, 500]),
        },
      },
    },
    async (request, reply) => {
      try {
        return reply.send(await TelegramAuthService.verifyCodeForUser(request.user.id, request.body.code));
      } catch (e: any) {
        return reply.code(e.code || 400).send({ error: e.message });
      }
    }
  );

  fastify.get(
    '/telegram/status',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Get Telegram verification status',
        security: [cookieAuthSecurity],
        response: {
          200: {
            type: 'object',
            properties: {
              linked: { type: 'boolean' },
              username: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              linkedAt: { type: 'string', format: 'date-time' },
              lastAuthAt: { type: 'string', format: 'date-time' },
            },
          },
          ...standardErrorResponses([401, 500]),
        },
      },
    },
    async (request, reply) => {
      try {
        return reply.send(await TelegramAuthService.getStatus(request.user.id));
      } catch (e: any) {
        return reply.code(e.code || 500).send({ error: e.message });
      }
    }
  );

  fastify.post(
    '/telegram/unlink',
    {
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
    },
    async (request, reply) => {
      try {
        return reply.send(await TelegramAuthService.unlink(request.user.id));
      } catch (e: any) {
        return reply.code(e.code || 500).send({ error: e.message });
      }
    }
  );
}
