import { FastifyInstance } from 'fastify';
import { DeveloperApiKeyService } from './developer-api-key.service';
import {
    cookieAuthSecurity, keyIdParamSchema, apiKeyRecordSchema, standardErrorResponses,
} from '../../shared/docs';

export async function developerApiKeyController(fastify: FastifyInstance) {
    fastify.get('/keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'List developer API keys',
            description: 'Returns all developer API keys for the authenticated user\'s workspace. Secrets are never returned — only the prefix and metadata.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'API keys (no secrets)', type: 'array', items: apiKeyRecordSchema },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => DeveloperApiKeyService.listKeys(request.user.id));

    fastify.post<{ Body: { name: string } }>(
        '/keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'Create a developer API key',
            description: 'Generates a new developer API key. **The full secret is only shown once at creation time** — store it securely.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Friendly label for this key', examples: ['Production SDK Key'] },
                },
            },
            response: {
                201: {
                    description: 'Key created — secret shown once',
                    type: 'object',
                    properties: {
                        key: { type: 'string', description: 'Full API key — store immediately, not persisted' },
                        record: apiKeyRecordSchema,
                    },
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const result = await DeveloperApiKeyService.createApiKeyForUser(request.user.id, request.body.name || 'Default Key');
                return reply.code(201).send(result);
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    fastify.delete<{ Params: { id: string } }>(
        '/keys/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'Revoke a developer API key',
            description: 'Permanently revokes and deletes the specified API key. Any SDK clients using this key will immediately lose access.',
            security: [cookieAuthSecurity],
            params: keyIdParamSchema(),
            response: {
                200: { description: 'Key revoked', type: 'object', properties: { success: { type: 'boolean' } } },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                await DeveloperApiKeyService.revokeKey(request.params.id, request.user.id);
                return { success: true };
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );
}
