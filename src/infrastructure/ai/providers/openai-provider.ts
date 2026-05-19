// openai-provider.ts
import { OpenAIClient } from '../types';
import { IAIProvider, CompletionRequest, CompletionResponse } from '../types';
import { buildSystemPrompt } from '../utils';
import { ENV } from '../../../shared/config/environments';
import OpenAI from 'openai';

function collectOpenAIText(node: unknown, seen = new WeakSet<object>()): string[] {
    if (typeof node === 'string') {
        return node ? [node] : [];
    }

    if (!node || typeof node !== 'object') {
        return [];
    }

    if (seen.has(node as object)) {
        return [];
    }
    seen.add(node as object);

    if (Array.isArray(node)) {
        return node.flatMap((item) => collectOpenAIText(item, seen));
    }

    const record = node as Record<string, unknown>;

    if (typeof record.output_text === 'string' && record.output_text) {
        return [record.output_text];
    }

    if (typeof record.text === 'string' && record.text) {
        return [record.text];
    }

    if (record.text && typeof record.text === 'object') {
        const textRecord = record.text as Record<string, unknown>;
        if (typeof textRecord.value === 'string' && textRecord.value) {
            return [textRecord.value];
        }
    }

    if (typeof record.content === 'string' && record.content) {
        return [record.content];
    }

    if (typeof record.refusal === 'string' && record.refusal) {
        return [record.refusal];
    }

    const priorityKeys = [
        'choices',
        'message',
        'messages',
        'output',
        'content',
        'data',
        'result',
        'response',
        'parts',
        'candidate',
        'candidates',
    ] as const;

    for (const key of priorityKeys) {
        if (!(key in record)) continue;
        const texts = collectOpenAIText(record[key], seen);
        if (texts.length > 0) {
            return texts;
        }
    }

    return [];
}

function summarizePayloadShape(node: unknown, depth = 0): unknown {
    if (node === null || node === undefined) return node;
    if (typeof node !== 'object') return typeof node;
    if (Array.isArray(node)) {
        if (node.length === 0) return [];
        if (depth >= 2) return [`array(${node.length})`];
        return [summarizePayloadShape(node[0], depth + 1)];
    }

    const record = node as Record<string, unknown>;
    if (depth >= 2) {
        return Object.keys(record).sort();
    }

    return Object.fromEntries(
        Object.keys(record)
            .sort()
            .slice(0, 12)
            .map((key) => [key, summarizePayloadShape(record[key], depth + 1)])
    );
}

function extractOpenAICompletionText(response: any): string {
    const text = collectOpenAIText(response).join('');
    if (text) {
        return text;
    }

    console.error(
        'Unsupported OpenAI completion payload shape:',
        JSON.stringify(summarizePayloadShape(response))
    );

    throw Object.assign(
        new Error(`OpenAI provider returned an unsupported completion payload shape`),
        { code: 502 }
    );
}

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

        const content = extractOpenAICompletionText(response);

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
            const text = chunk.choices?.[0]?.delta?.content;
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
