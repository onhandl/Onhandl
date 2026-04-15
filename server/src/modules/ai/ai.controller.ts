import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AiService } from './ai.service';
import { CompletionRequest } from '../../infrastructure/ai/types';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
    // Test API connection
    fastify.post<{ Body: { provider: string; apiKey: string } }>(
        '/test-connection',
        async (request, reply) => {
            const { provider, apiKey } = request.body;
            try {
                return await AiService.testConnection(provider, apiKey);
            } catch (error: any) {
                return reply.code(error.code || 500).send({ error: error.message });
            }
        }
    );

    // Generic AI completion endpoint (supports hybrid key management)
    fastify.post<{ Body: CompletionRequest }>(
        '/complete',
        async (request, reply) => {
            const apiKey = (request.headers['x-ai-api-key'] as string);
            try {
                return await AiService.generateCompletion(request.body, apiKey);
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        }
    );

    // Streaming AI completion endpoint
    fastify.post<{ Body: CompletionRequest & { agentId?: string } }>(
        '/stream',
        async (request, reply) => {
            const apiKey = (request.headers['x-ai-api-key'] as string);
            try {
                const stream = await AiService.generateStream(request.body, apiKey);

                const readable = Readable.from((async function* () {
                    try {
                        for await (const chunk of stream) {
                            if (chunk) {
                                yield `data: ${JSON.stringify({ content: chunk })}\n\n`;
                            }
                        }
                    } catch (err: any) {
                        yield `data: ${JSON.stringify({ error: err.message })}\n\n`;
                    }
                })());

                return reply
                    .header('Content-Type', 'text/event-stream')
                    .header('Cache-Control', 'no-cache')
                    .header('Connection', 'keep-alive')
                    .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                    .header('Access-Control-Allow-Credentials', 'true')
                    .send(readable);

            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        }
    );
};
