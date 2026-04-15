import { FastifyInstance } from 'fastify';
import { AIFactory } from '../../infrastructure/ai/factory';
import type { MessageRole } from '../../infrastructure/ai/types';
import { ENV } from '../../shared/config/environments';
import { telegramService, TelegramService } from '../../infrastructure/messaging/telegram.service';

const SYSTEM_PROMPT = `You are Onhandl Assistant — the official support guide for the Onhandl platform.
Onhandl is an AI workflow platform letting users build visual multi-agent workflows connecting to crypto networks via Nervos CKB and social mediums. Answer strictly within your scope of knowledge concisely.`;

export async function botsController(fastify: FastifyInstance) {
    // ── AI chat bot ────────────────────────────────────────────────────────────
    fastify.post<{ Body: { message: string; history?: Array<{ role: string; content: string }> } }>(
        '/chat',
        async (request, reply) => {
            const { message, history = [] } = request.body;
            if (!message?.trim()) return reply.code(400).send({ error: 'Message is required' });

            const msgList = [
                { role: 'system' as MessageRole, content: SYSTEM_PROMPT },
                ...history.slice(-10).map((m) => ({
                    role: (m.role === 'user' ? 'user' : 'assistant') as MessageRole,
                    content: m.content,
                })),
                { role: 'user' as MessageRole, content: message },
            ];

            const providerOrder: string[] = [];
            if (ENV.GEMINI_API_KEY) providerOrder.push('gemini');
            if (ENV.OPENAI_API_KEY) providerOrder.push('openai');
            providerOrder.push('ollama');

            let lastError: unknown;
            for (const providerName of providerOrder) {
                try {
                    const aiProvider = AIFactory.getProvider(providerName);
                    const response = await aiProvider.generateCompletion({ messages: msgList });
                    return { reply: response.content };
                } catch (err) {
                    lastError = err;
                }
            }
            console.error('[BotChat] All providers failed:', lastError);
            return reply.code(500).send({ error: 'Bot is temporarily unavailable. Please try again.' });
        }
    );

    // ── Telegram webhook ───────────────────────────────────────────────────────
    fastify.post('/telegram/webhook', async (request, reply) => {
        try {
            const update: any = request.body;
            const processedUpdate = telegramService.processUpdate(update);
            if (!processedUpdate) return reply.code(400).send({ status: 'error', message: 'Invalid update' });
            return reply.send({ status: 'ok' });
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ status: 'error', message: 'Internal server error' });
        }
    });

    fastify.get('/telegram/webhook', async (_request, reply) => {
        return reply.send('Verification endpoint operational');
    });

    fastify.post<{ Body: { botToken: string; chatId: string; botName?: string } }>(
        '/telegram/test-connection',
        async (request, reply) => {
            const { botToken, chatId, botName } = request.body;
            if (!botToken || !chatId) return reply.code(400).send({ error: 'Bot Token and Chat ID are required' });
            try {
                const tempService = new TelegramService(botToken);
                const result = await tempService.sendMessage(
                    chatId,
                    `🔄 *Test Connection*\n\nThis is a test message from your ${botName || 'Trading Bot'}. If you see this, the connection is working!`,
                    { parse_mode: 'Markdown' }
                );
                if (result && result.ok) {
                    return { success: true, message: 'Connection successful! Test message sent to Telegram.' };
                } else {
                    throw new Error(result.description || 'Failed to send message');
                }
            } catch (error: any) {
                return reply.code(500).send({ error: `Connection failed: ${error.message}` });
            }
        }
    );
}
