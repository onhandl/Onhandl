import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AiService } from './ai.service';
import { CompletionRequest } from '../../infrastructure/ai/types';
import { standardErrorResponses } from '../../shared/docs';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { provider: string; apiKey: string } }>('/test-connection', {
        schema: {
            tags: ['AI'],
            summary: 'Test AI provider connection',
            description: 'Tests connectivity and authentication with the specified AI provider using the provided API key.',
            body: {
                type: 'object',
                required: ['provider', 'apiKey'],
                properties: {
                    provider: { type: 'string', description: 'AI provider name (e.g. openai, gemini, ollama)' },
                    apiKey: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Connection result', type: 'object', additionalProperties: true },
                ...standardErrorResponses([500]),
            },
        },
    }, async (request, reply) => {
        try { return await AiService.testConnection(request.body.provider, request.body.apiKey); }
        catch (error: any) { return reply.code(error.code || 500).send({ error: error.message }); }
    });

    fastify.post<{ Body: CompletionRequest }>('/complete', {
        schema: {
            tags: ['AI'],
            summary: 'AI completion',
            description: 'Generates an AI completion using the configured provider. Pass an optional `X-AI-API-Key` header to override stored keys.',
            body: {
                type: 'object',
                properties: {
                    messages: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    model: { type: 'string' },
                    temperature: { type: 'number' },
                },
            },
            response: {
                200: { description: 'Completion result', type: 'object', additionalProperties: true },
                ...standardErrorResponses([500]),
            },
        },
    }, async (request, reply) => {
        const apiKey = request.headers['x-ai-api-key'] as string;
        try { return await AiService.generateCompletion(request.body, apiKey); }
        catch (error: any) { return reply.code(500).send({ error: error.message }); }
    });

    fastify.post<{ Body: CompletionRequest & { agentId?: string } }>('/stream', {
        schema: {
            tags: ['AI'],
            summary: 'Streaming AI completion (SSE)',
            description: 'Generates a streaming AI completion via Server-Sent Events. Pass an optional `X-AI-API-Key` header to override stored keys.',
            body: {
                type: 'object',
                properties: {
                    messages: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    model: { type: 'string' },
                    agentId: { type: 'string' },
                },
            },
            response: {
                200: { description: 'SSE stream (text/event-stream)', type: 'string' },
                ...standardErrorResponses([500]),
            },
        },
    }, async (request, reply) => {
        const apiKey = request.headers['x-ai-api-key'] as string;
        try {
            const stream = await AiService.generateStream(request.body, apiKey);
            const readable = Readable.from((async function* () {
                try {
                    for await (const chunk of stream) {
                        if (chunk) yield `data: ${JSON.stringify({ content: chunk })}\n\n`;
                    }
                } catch (err: any) {
                    yield `data: ${JSON.stringify({ error: err.message })}\n\n`;
                }
            })());
            return reply
                .header('Content-Type', 'text/event-stream').header('Cache-Control', 'no-cache')
                .header('Connection', 'keep-alive')
                .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                .header('Access-Control-Allow-Credentials', 'true').send(readable);
        } catch (error: any) { return reply.code(500).send({ error: error.message }); }
    });
};
