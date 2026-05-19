import { ENV } from '../config/environments';

export function resolveProviderKeys(userApiKeys: any): { provider: string; apiKey?: string; model?: string } {
    const k = userApiKeys || {};
    if (k.gemini) return { provider: 'gemini', apiKey: k.gemini };
    if (k.openai) return { provider: 'openai', apiKey: k.openai, model: k.openaiModel || undefined };
    if (k.ollamaBaseUrl) return { provider: 'ollama', apiKey: k.ollamaBaseUrl, model: k.ollamaModel || 'qwen2.5:3b' };

    const def = ENV.DEFAULT_AI_PROVIDER;
    if (def === 'gemini' && ENV.GEMINI_API_KEY) return { provider: 'gemini', apiKey: ENV.GEMINI_API_KEY };
    if (def === 'openai' && ENV.OPENAI_API_KEY) return { provider: 'openai', apiKey: ENV.OPENAI_API_KEY };
    return { provider: 'ollama', model: ENV.OLLAMA_MODEL || 'qwen2.5:3b' };
}
