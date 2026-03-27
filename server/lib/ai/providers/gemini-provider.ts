import { GoogleGenAI } from "@google/genai";
import {
    IAIProvider,
    CompletionRequest,
    CompletionResponse
} from '../types';
import { buildSystemPrompt } from '../utils';

export class GeminiProvider implements IAIProvider {
    private defaultModel = 'gemini-2.0-flash';

    async *generateStream(request: CompletionRequest): AsyncIterableIterator<string> {
        const apiKey = request.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API key is missing.');

        const ai = new GoogleGenAI({ apiKey });
        const model = request.model || this.defaultModel;

        const systemInstruction = request.character ? buildSystemPrompt(request.character) : '';
        const contents = request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const result = await ai.models.generateContentStream({
            model: model,
            contents,
            config: {
                systemInstruction: systemInstruction || undefined,
                temperature: request.temperature ?? 0.7,
                maxOutputTokens: request.maxTokens,
            }
        });

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) yield chunkText;
        }
    }

    async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
        const apiKey = request.apiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('Gemini API key is missing. Please provide one in the request or configure it on the server.');
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = request.model || this.defaultModel;

        let systemInstruction = '';
        if (request.character) {
            systemInstruction = buildSystemPrompt(request.character);
        }

        const contents = request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        let responseText = '';
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents,
                config: {
                    systemInstruction: systemInstruction || undefined,
                    temperature: request.temperature ?? 0.7,
                    maxOutputTokens: request.maxTokens,
                }
            });
            responseText = response.text || '';

            return {
                content: responseText,
                usage: {
                    promptTokens: response.usageMetadata?.promptTokenCount || 0,
                    completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                    totalTokens: response.usageMetadata?.totalTokenCount || 0,
                },
                model: model,
                provider: 'gemini',
            };
        } catch (err: any) {
            const status = err?.status || err?.code;
            const msg = err?.message || String(err);
            if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
                throw new Error(`Gemini API quota exhausted. Please provide your own Gemini API key at https://aistudio.google.com/apikey`);
            }
            if (status === 401 || msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
                throw new Error(`Invalid Gemini API key. Please check your key and try again.`);
            }
            if (status === 404 || msg.includes('NOT_FOUND')) {
                throw new Error(`Gemini model '${model}' not found. Check your API key permissions.`);
            }
            throw err;
        }
    }

    async testConnection(apiKey: string): Promise<boolean> {
        try {
            const ai = new GoogleGenAI({ apiKey });
            await ai.models.list({ config: { pageSize: 1 } });
            return true;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}
