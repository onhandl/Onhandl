import { FastifyInstance } from 'fastify';
import { standardErrorResponses } from '../../shared/docs';
import { chatWithBot, ChatHistoryItem } from './bot.service';
import { TelegramTransport } from '../../infrastructure/messaging/telegram/telegram.login';

export async function botsController(fastify: FastifyInstance) {
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
                const tempTransport = new TelegramTransport(botToken);
                const result = await tempTransport.sendMessage(chatId, `🔄 *Test Connection*\n\nThis is a test message from your ${botName || 'Trading Bot'}. If you see this, the connection is working!`, { parse_mode: 'Markdown' });
                if (result && result.ok) return { success: true, message: 'Connection successful! Test message sent to Telegram.' };
                throw new Error(result.description || 'Failed to send message');
            } catch (error: any) { return reply.code(400).send({ error: `Connection failed: ${error.message}` }); }
        }
    );
}
