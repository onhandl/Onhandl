import {
    IAIProvider,
    CompletionRequest,
    CompletionResponse
} from '../types';
import { buildSystemPrompt } from '../utils';
import { ENV } from '../../../shared/config/environments';

export class OllamaProvider implements IAIProvider {
    private defaultModel = ENV.OLLAMA_MODEL || 'qwen2.5:3b';
    private defaultBaseUrl = ENV.OLLAMA_BASE_URL || 'http://localhost:11434';

    async *generateStream(request: CompletionRequest): AsyncIterableIterator<string> {
        let baseUrl = this.defaultBaseUrl;
        if (request.apiKey && request.apiKey.startsWith('http')) {
            baseUrl = request.apiKey;
        } else if (process.env.OLLAMA_BASE_URL) {
            baseUrl = process.env.OLLAMA_BASE_URL;
        }

        const model = request.model || this.defaultModel;

        const systemInstruction = request.character ? buildSystemPrompt(request.character) : '';
        const ollamaMessages = [];
        if (systemInstruction) {
            ollamaMessages.push({ role: 'system', content: systemInstruction });
        }

        for (const msg of request.messages) {
            ollamaMessages.push({
                role: msg.role === 'developer' ? 'system' : msg.role,
                content: msg.content
            });
        }

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: ollamaMessages,
                stream: true,
                options: {
                    temperature: request.temperature ?? 0.7,
                    num_predict: request.maxTokens,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Ollama Stream Error (${response.status}): ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            yield json.message.content;
                        }
                    } catch (e) {
                        console.warn('Failed to parse Ollama stream chunk:', line);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
        // If apiKey looks like a URL starting with http, use it as baseUrl, otherwise default
        let baseUrl = this.defaultBaseUrl;
        if (request.apiKey && request.apiKey.startsWith('http')) {
            baseUrl = request.apiKey;
        } else if (process.env.OLLAMA_BASE_URL) {
            baseUrl = process.env.OLLAMA_BASE_URL;
        }

        const model = request.model || this.defaultModel;

        let systemInstruction = '';
        if (request.character) {
            systemInstruction = buildSystemPrompt(request.character);
        }

        const ollamaMessages = [];
        if (systemInstruction) {
            ollamaMessages.push({ role: 'system', content: systemInstruction });
        }

        for (const msg of request.messages) {
            ollamaMessages.push({
                role: msg.role === 'developer' ? 'system' : msg.role,
                content: msg.content
            });
        }

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: ollamaMessages,
                stream: false,
                options: {
                    temperature: request.temperature ?? 0.7,
                    num_predict: request.maxTokens,
                }
            })
        });

        if (!response.ok) {
            let errorText = await response.text().catch(() => '');
            throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.message?.content || '',
            usage: {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            },
            model: model,
            provider: 'ollama',
        };
    }

    async testConnection(baseUrlInput?: string): Promise<boolean> {
        try {
            let baseUrl = this.defaultBaseUrl;
            if (baseUrlInput && baseUrlInput.startsWith('http')) {
                baseUrl = baseUrlInput;
            }
            const response = await fetch(`${baseUrl}/api/tags`);
            if (!response.ok) return false;
            // Optionally, check if the default model is in the tags list if required
            // const data = await response.json();
            // const models = data.models.map((m: any) => m.name);
            // return models.includes(this.defaultModel);
            return true;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }
}
