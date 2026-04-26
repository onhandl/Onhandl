import { apiFetch } from './api-client';

export const aiApi = {
    testConnection: async (provider: string, apiKey: string) => {
        return apiFetch('/ai/test-connection', {
            method: 'POST',
            body: JSON.stringify({ provider, apiKey }),
        });
    },

    generateText: async (prompt: string, options?: any) => {
        return apiFetch('/ai/complete', {
            method: 'POST',
            body: JSON.stringify({
                provider: options?.provider || 'gemini',
                model: options?.model,
                messages: [{ role: 'user', content: prompt }],
                character: options?.character,
                temperature: options?.temperature ?? 0.7,
                maxTokens: options?.maxTokens ?? 1000,
            })
        });
    },
};
