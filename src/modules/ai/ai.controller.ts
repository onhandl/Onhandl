import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AiService } from './ai.service';
import { CompletionRequest } from '../../infrastructure/ai/types';
import { standardErrorResponses } from '../../shared/docs';

/**
 * AiRoutes: Internal utility endpoints for direct AI model interaction, 
 * bypassing agent orchestration for testing or specialized tasks.
 */
export const aiRoutes: FastifyPluginAsync = async (fastify) => {

    // POST /ai/test-connection - Provider validation
    fastify.post<{ Body: { provider: string; apiKey: string; baseUrl?: string } }>('/test-connection', {
        schema: {
            tags: ['AI Primitives'],
            summary: 'Test AI provider connection',
            description: 'Validates API keys and connectivity for a specific model provider (OpenAI, Gemini, Ollama).',
            body: {
                type: 'object',
                required: ['provider'],
                properties: {
                    provider: { type: 'string', enum: ['openai', 'gemini', 'ollama','anthropic'], description: 'Name of the AI backend' },
                    apiKey: { type: 'string', description: 'Provider-specific secret key' },
                    baseUrl: { type: 'string', description: 'Provider-specific base URL' },
                },
            },
            response: {
                200: {
                    description: 'Connectivity report',
                    type: 'object',
                    required: ['success'],
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        models: { type: 'array', items: { type: 'string' } },
                    },
                },
                ...standardErrorResponses([400, 500]),
            },
        },
    }, async (request, reply) => {
        try { 
            return await AiService.testConnection(
                request.body.provider, 
                request.body.apiKey, 
                request.body.baseUrl
            ); 
        } catch (error: any) { 
            return reply.code(error.code || 500).send({ error: error.message }); 
        }
    });

    // POST /ai/complete - Synchronous model call
    fastify.post<{ Body: CompletionRequest }>('/complete', {
        schema: {
            tags: ['AI Primitives'],
            summary: 'AI completion',
            description: 'Generates a standard chat completion. Pass `X-AI-API-Key` to override workspace defaults.',
            body: {
                type: 'object',
                required: ['messages'],
                properties: {
                    messages: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['role', 'content'],
                            properties: {
                                role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                                content: { type: 'string' },
                            },
                        },
                    },
                    model: { type: 'string', description: 'Specific model string (e.g. gpt-4, gemini-pro)' },
                    temperature: { type: 'number', minimum: 0, maximum: 2 },
                },
            },
            response: {
                200: {
                    description: 'Model output',
                    type: 'object',
                    required: ['content'],
                    properties: {
                        content: { type: 'string' },
                        usage: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        const apiKey = request.headers['x-ai-api-key'] as string;
        try { 
            return await AiService.generateCompletion(request.body, apiKey); 
        } catch (error: any) { 
            return reply.code(500).send({ error: error.message }); 
        }
    });

    // POST /ai/stream - SSE model call
    fastify.post<{ Body: CompletionRequest & { agentId?: string } }>('/stream', {
        schema: {
            tags: ['AI Primitives'],
            summary: 'Streaming AI completion (SSE)',
            description: 'Establishes a real-time event stream for token-by-token processing.',
            body: {
                type: 'object',
                required: ['messages'],
                properties: {
                    messages: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    model: { type: 'string' },
                    agentId: { type: 'string', description: 'Optional agent context for attribution' },
                },
            },
            response: {
                200: {
                    description: 'Token event stream',
                    type: 'string',
                    content: { 'text/event-stream': { schema: { type: 'string' } } },
                },
                ...standardErrorResponses([401, 500]),
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
                .header('Content-Type', 'text/event-stream')
                .header('Cache-Control', 'no-cache')
                .header('Connection', 'keep-alive')
                .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                .header('Access-Control-Allow-Credentials', 'true')
                .send(readable);
        } catch (error: any) { 
            return reply.code(500).send({ error: error.message }); 
        }
    });
};