import { FastifyInstance } from 'fastify';
import { DeveloperApiKeyService } from './developer-api-key.service';
import {
    cookieAuthSecurity,
    keyIdParamSchema,
    apiKeyRecordSchema,
    standardErrorResponses,
} from '../../shared/docs';

/**
 * DeveloperApiKeyController: Endpoints for managing workspace API keys used by
 * external SDKs or automated integrations.
 */
export async function developerApiKeyController(fastify: FastifyInstance) {

    // GET /keys - List prefix and metadata
    fastify.get('/keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'List developer API keys',
            description: 'Returns all developer API keys for the authenticated user\'s workspace. Note: Full secret keys are never returned after creation for security.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'List of API key metadata',
                    type: 'array',
                    items: apiKeyRecordSchema,
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => DeveloperApiKeyService.listKeys(request.user.id));

    // POST /keys - Create a new key
    fastify.post<{ Body: { name: string } }>(
        '/keys', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'Create a developer API key',
            description: 'Generates a new developer API key. **Warning**: The full secret is ONLY shown in this response. It cannot be retrieved later.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', description: 'A descriptive label for this key', examples: ['Production Bot Key'] },
                },
            },
            response: {
                201: {
                    description: 'API key successfully created',
                    type: 'object',
                    required: ['key', 'record'],
                    properties: {
                        key: { type: 'string', description: 'The absolute full API key string (Keep it secret!)' },
                        record: apiKeyRecordSchema,
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const result = await DeveloperApiKeyService.createApiKeyForUser(request.user.id, request.body.name || 'Default Key');
                return reply.code(201).send(result);
            } catch (err: any) {
                console.error('[DeveloperApiKeyController] Error during key creation:', err);
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );

    // DELETE /keys/:id - Revoke access
    fastify.delete<{ Params: { id: string } }>(
        '/keys/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Developer API Keys'],
            summary: 'Revoke a developer API key',
            description: 'Deactivates and deletes an API key. Any integrations using this key will immediately return 401 Unauthorized.',
            security: [cookieAuthSecurity],
            params: keyIdParamSchema(),
            response: {
                200: {
                    description: 'API key successfully revoked',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                    },
                },
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
