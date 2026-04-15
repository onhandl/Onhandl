import { AIFactory } from '../../infrastructure/ai/factory';
import { ENV } from '../../shared/config/environments';
import type { MessageRole } from '../../infrastructure/ai/types';

const SYSTEM_PROMPT = `You are Onhandl Assistant — the official support guide for the Onhandl platform.
Onhandl is an AI workflow platform letting users build visual multi-agent workflows connecting to crypto networks via Nervos CKB and social mediums. Answer strictly within your scope of knowledge concisely.`;

/**
 * Minimal shape for incoming chat history items.
 */
export interface ChatHistoryItem {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Sends a chat message to the best available AI provider, with automatic failover.
 * Provider priority: Gemini → OpenAI → Ollama.
 * Throws AppError (code 503) if all providers fail.
 */
export async function chatWithBot(
    message: string,
    history: ChatHistoryItem[] = [],
): Promise<string> {
    const msgList = [
        { role: 'system' as MessageRole, content: SYSTEM_PROMPT },
        ...history.slice(-10).map((m) => ({
            role: m.role as MessageRole,
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
            const provider = AIFactory.getProvider(providerName);
            const response = await provider.generateCompletion({ messages: msgList });
            return response.content;
        } catch (err) {
            lastError = err;
        }
    }

    console.error('[BotService] All providers failed:', lastError);
    throw Object.assign(new Error('Bot is temporarily unavailable. Please try again.'), { code: 503 });
}
