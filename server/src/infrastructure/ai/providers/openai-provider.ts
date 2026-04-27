// openai-provider.ts
import { OpenAIClient } from '../types';
import { IAIProvider, CompletionRequest, CompletionResponse } from '../types';
import { buildSystemPrompt } from '../utils';
import { ENV } from '../../../shared/config/environments';
import OpenAI from 'openai';

export class OpenAIProvider implements IAIProvider {
    private client = OpenAIClient;
    private defaultModel = ENV.OPENAI_MODEL || 'gpt-5.4';

    private buildMessages(request: CompletionRequest) {
        const messages = [...request.messages];
        if (request.character?.instructions?.length) {
            messages.unshift({ role: 'system', content: buildSystemPrompt(request.character) });
        }
        return messages;
    }

    async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
        const model = request.model || this.defaultModel;
        const client = request.apiKey || request.baseUrl
            ? new OpenAI({
                apiKey: request.apiKey || ENV.OPENAI_API_KEY,
                baseURL: request.baseUrl || ENV.OPENAI_BASE_URL,
            })
            : this.client;

        if (!request.apiKey && !ENV.OPENAI_API_KEY) {
            throw Object.assign(new Error('OpenAI API key is missing. Configure one on the server or save an OpenAI key in settings.'), { code: 400 });
        }

        const response = await client.chat.completions.create({
            model: model,
            messages: this.buildMessages(request) as any,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens,
        });

        const content = response.choices[0]?.message?.content || '';

        return {
            content: content,
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            },
            model: model,
            provider: 'openai',
        };
    }

    async *generateStream(request: CompletionRequest): AsyncIterableIterator<string> {
        const model = request.model || this.defaultModel;

        const stream = await this.client.chat.completions.create({
            model: model,
            messages: this.buildMessages(request) as any,
            stream: true,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens,
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
    }

    async testConnection(apiKey?: string, baseUrl?: string): Promise<boolean> {
        try {
            const finalApiKey = apiKey || ENV.OPENAI_API_KEY;
            const finalBaseUrl = baseUrl || ENV.OPENAI_BASE_URL;

            if (!finalApiKey) {
                console.error('No API key provided for OpenAI');
                return false;
            }

            const client = new OpenAI({
                apiKey: finalApiKey,
                baseURL: finalBaseUrl,
            });

            await client.chat.completions.create({
                model: ENV.OPENAI_MODEL || 'gpt-5.4',
                messages: [{ role: 'user', content: 'ok' }],
                max_tokens: 1,
            });

            console.log('✅ OpenAI connection successful');
            return true;
        } catch (error: any) {
            console.error('❌ OpenAI connection failed:', error.message);
            return false;
        }
    }
}
