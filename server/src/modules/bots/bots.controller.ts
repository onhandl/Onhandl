import { FastifyInstance } from 'fastify';
import { standardErrorResponses } from '../../shared/docs';
import { chatWithBot, ChatHistoryItem } from './bot.service';
import { telegramService, TelegramService } from '../../infrastructure/messaging/telegram.service';

/**
 * BotsController: Public assistance and multi-platform bot integration endpoints.
 */
export async function botsController(fastify: FastifyInstance) {

    // POST /chat - Main AI Assistant interaction
    fastify.post<{ Body: { message: string; history?: Array<{ role: string; content: string }> } }>(
        '/chat', {
        schema: {
            tags: ['AI Primitives'],
            summary: 'Chat with the Onhandl Assistant',
            description: 'Sends a message to the Onhandl AI support assistant. Provide short-term history for conversational continuity.',
            body: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1, description: 'User message text' },
                    history: {
                        type: 'array',
                        description: 'Optional previous messages in this session',
                        items: {
                            type: 'object',
                            required: ['role', 'content'],
                            properties: {
                                role: { type: 'string', enum: ['user', 'assistant'] },
                                content: { type: 'string' },
                            },
                        },
                    },
                },
            },
            response: {
                200: {
                    description: 'Assistant reply text',
                    type: 'object',
                    required: ['reply'],
                    properties: {
                        reply: { type: 'string' },
                    },
                },
                ...standardErrorResponses([400, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const { message, history = [] } = request.body;
                if (!message?.trim()) return reply.code(400).send({ error: 'Message is required' });
                const replyText = await chatWithBot(message, history as ChatHistoryItem[]);
                return { reply: replyText };
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message }); }
        }
    );

    // POST /telegram/webhook - Inbound messaging
    fastify.post<{ Body: { update_id: number; message?: any;[key: string]: any } }>('/telegram/webhook', {
        schema: {
            tags: ['Social Integrations'],
            summary: 'Telegram bot webhook',
            description: 'Processes real-time updates from the Telegram Bot API. Should only be called by Telegram servers.',
            response: {
                200: {
                    description: 'Update acknowledged',
                    type: 'object',
                    properties: { status: { type: 'string' } },
                },
                ...standardErrorResponses([400, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const processedUpdate = telegramService.processUpdate(request.body as any);
            if (!processedUpdate) return reply.code(400).send({ error: 'Invalid update' });
            return reply.send({ status: 'ok' });
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // GET /telegram/webhook - Webhook setup check
    fastify.get('/telegram/webhook', {
        schema: {
            tags: ['Social Integrations'],
            summary: 'Telegram webhook verification',
            description: 'Utility route to verify our server is reachable for Telegram webhook registration.',
            response: {
                200: { description: 'Server reachable', type: 'string' },
            },
        },
    }, async (_request, reply) => reply.send('Verification endpoint operational'));

    // POST /telegram/test-connection - User-facing verification
    fastify.post<{ Body: { botToken: string; chatId: string; botName?: string } }>(
        '/telegram/test-connection', {
        schema: {
            tags: ['Social Integrations'],
            summary: 'Test Telegram bot connection',
            description: 'Validates a user-provided bot token by attempting to send a greeting message.',
            body: {
                type: 'object',
                required: ['botToken', 'chatId'],
                properties: {
                    botToken: { type: 'string', description: 'BotFather token' },
                    chatId: { type: 'string', description: 'Chat ID to receive test message' },
                    botName: { type: 'string', description: 'Optional label for the bot' },
                },
            },
            response: {
                200: {
                    description: 'Connection test passed',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
                ...standardErrorResponses([400, 500]),
            },
        },
    },
        async (request, reply) => {
            const { botToken, chatId, botName } = request.body;
            if (!botToken || !chatId) return reply.code(400).send({ error: 'Bot Token and Chat ID are required' });
            try {
                const tempService = new TelegramService(botToken);
                const result = await tempService.sendMessage(chatId, `🔄 *Test Connection*\n\nThis is a test message from your ${botName || 'Trading Bot'}. If you see this, the connection is working!`, { parse_mode: 'Markdown' });
                if (result && result.ok) return { success: true, message: 'Connection successful! Test message sent to Telegram.' };
                throw new Error(result.description || 'Failed to send message');
            } catch (error: any) { return reply.code(400).send({ error: `Connection failed: ${error.message}` }); }
        }
    );
}
