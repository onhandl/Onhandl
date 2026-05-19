import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { DeveloperApiKeyService } from '../../modules/developer-api-keys/developer-api-key.service';

export default fp(async (fastify) => {
    fastify.decorate('authenticateApiKey', async (request: FastifyRequest, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;
        const apiKeyHeader = request.headers['x-api-key'];

        let rawKey: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            rawKey = authHeader.substring(7);
        } else if (apiKeyHeader) {
            rawKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
        }

        if (!rawKey) {
            return reply.code(401).send({ error: 'API key missing' });
        }

        const authContext = await DeveloperApiKeyService.authenticate(rawKey);

        if (!authContext) {
            return reply.code(401).send({ error: 'Invalid API key' });
        }

        request.apiKeyAuth = authContext;
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        authenticateApiKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
