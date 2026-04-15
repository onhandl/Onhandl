import { FastifyInstance } from 'fastify';
import { standardErrorResponses } from '../../shared/docs';
import { chatWithBot, ChatHistoryItem } from './bot.service';
import { telegramService, TelegramService } from '../../infrastructure/messaging/telegram.service';

export async function botsController(fastify: FastifyInstance) {
    fastify.post<{ Body: { message: string; history?: Array<{ role: string; content: string }> } }>(
        '/chat', {
        schema: {
            tags: ['Bots'],
            summary: 'Chat with the Onhandl Assistant',
            description: 'Sends a message to the Onhandl AI support assistant. Pass conversation history for context-aware responses.',
            body: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1 },
                    history: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                role: { type: 'string', enum: ['user', 'assistant'] },
                                content: { type: 'string' },
                            },
                        },
                    },
                },
            },
            response: {
                200: { description: 'Assistant reply', type: 'object', properties: { reply: { type: 'string' } } },
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

    fastify.post<{ Body: { update_id: number; message?: any;[key: string]: any } }>('/telegram/webhook', {
        schema: {
            tags: ['Bots'],
            summary: 'Telegram bot webhook',
            description: 'Receives incoming Telegram updates. Called by Telegram when a user sends a message to the configured bot.',
            response: {
                200: { description: 'Update processed', type: 'object', properties: { status: { type: 'string' } } },
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

    fastify.get('/telegram/webhook', {
        schema: {
            tags: ['Bots'],
            summary: 'Telegram webhook verification',
            description: 'Health check used during Telegram webhook setup to verify server availability.',
            response: { 200: { description: 'Operational', type: 'string' } },
        },
    }, async (_request, reply) => reply.send('Verification endpoint operational'));

    fastify.post<{ Body: { botToken: string; chatId: string; botName?: string } }>(
        '/telegram/test-connection', {
        schema: {
            tags: ['Bots'],
            summary: 'Test Telegram bot connection',
            description: 'Sends a test message to the specified Telegram chat using the provided bot token to verify connectivity.',
            body: {
                type: 'object',
                required: ['botToken', 'chatId'],
                properties: {
                    botToken: { type: 'string', description: 'Telegram bot token' },
                    chatId: { type: 'string', description: 'Telegram chat ID' },
                    botName: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Connection successful', type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
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
