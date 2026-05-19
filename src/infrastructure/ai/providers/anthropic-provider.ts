import { IAIProvider, CompletionRequest, CompletionResponse } from '../types';
import { buildSystemPrompt } from '../utils';
import { ENV } from "../../../shared/config/environments";

function extractAnthropicTextPart(part: unknown): string {
    if (typeof part === 'string') return part;
    if (part && typeof part === 'object') {
        const record = part as Record<string, unknown>;
        if (typeof record.text === 'string') return record.text;
        if (typeof record.content === 'string') return record.content;
    }
    return '';
}

function extractAnthropicCompletionText(response: any): string {
    if (Array.isArray(response?.content)) {
        const content = response.content.map(extractAnthropicTextPart).join('');
        if (content) {
            return content;
        }
    }

    if (typeof response?.content === 'string') {
        return response.content;
    }

    throw Object.assign(
        new Error('Anthropic provider returned an unsupported completion payload shape'),
        { code: 502 }
    );
}

export class AnthropicProvider implements IAIProvider {
    private defaultModel = ENV.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    
    private async makeRequest(endpoint: string, body: any, apiKey?: string, baseUrl?: string) {
        const finalAuthToken = apiKey || ENV.ANTHROPIC_AUTH_TOKEN || ENV.ANTHROPIC_API_KEY;
        let finalBaseUrl = baseUrl || ENV.ANTHROPIC_BASE_URL || 'https://share-ai.ckbdev.com';
        
        // Normalize base URL: remove trailing slash and any /v1
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '').replace(/\/v1$/, '');
        
        // Normalize endpoint: ensure it starts with /v1/
        let finalEndpoint = endpoint;
        if (!finalEndpoint.startsWith('/v1/')) {
            finalEndpoint = `/v1${finalEndpoint}`;
        }
        
        const url = `${finalBaseUrl}${finalEndpoint}`;
        console.log(`Making request to: ${url}`);
        console.log(`Using auth token: ${finalAuthToken?.substring(0, 20)}...`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalAuthToken}`,
            },
            body: JSON.stringify(body),
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response: ${errorText.substring(0, 200)}`);
            throw new Error(`Anthropic API error (${response.status}): ${errorText.substring(0, 100)}`);
        }
        
        const data = await response.json();
        console.log(`Response successful`);
        return data;
    }

    private buildMessages(request: CompletionRequest) {
        const messages = [];
        let systemPrompt = '';
        
        if (request.character?.instructions?.length) {
            systemPrompt = buildSystemPrompt(request.character);
        }
        
        for (const msg of request.messages) {
            if (msg.role === 'system') {
                systemPrompt = systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content;
            } else if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
        
        return { messages, systemPrompt };
    }

    async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
        const model = request.model || this.defaultModel;
        const { messages, systemPrompt } = this.buildMessages(request);
        
        const body: any = {
            model: model,
            max_tokens: request.maxTokens || 1024,
            messages: messages,
            temperature: request.temperature ?? 0.7,
        };
        
        if (systemPrompt) {
            body.system = systemPrompt;
        }
        
        console.log(`Generating completion with model: ${model}`);
        
        const response = await this.makeRequest('/messages', body, request.apiKey, request.baseUrl);
        const content = extractAnthropicCompletionText(response);
        
        return {
            content: content,
            usage: {
                promptTokens: response.usage?.input_tokens || 0,
                completionTokens: response.usage?.output_tokens || 0,
                totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
            },
            model: model,
            provider: 'anthropic',
        };
    }

    async *generateStream(request: CompletionRequest): AsyncIterableIterator<string> {
        const model = request.model || this.defaultModel;
        const { messages, systemPrompt } = this.buildMessages(request);
        const finalAuthToken = request.apiKey || ENV.ANTHROPIC_AUTH_TOKEN || ENV.ANTHROPIC_API_KEY;
        let finalBaseUrl = request.baseUrl || ENV.ANTHROPIC_BASE_URL || 'https://share-ai.ckbdev.com';
        
        // Normalize base URL
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '').replace(/\/v1$/, '');
        
        const body: any = {
            model: model,
            max_tokens: request.maxTokens || 1024,
            messages: messages,
            temperature: request.temperature ?? 0.7,
            stream: true,
        };
        
        if (systemPrompt) {
            body.system = systemPrompt;
        }
        
        const response = await fetch(`${finalBaseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalAuthToken}`,
            },
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            throw new Error(`Stream request failed: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const chunk = JSON.parse(data);
                        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                            yield chunk.delta.text;
                        }
                    } catch (e) {
                        
                    }
                }
            }
        }
    }

async testConnection(apiKey?: string, baseUrl?: string): Promise<boolean> {
    try {
        console.log('Testing Anthropic connection...');
        
        const response = await this.makeRequest('/messages', {
            model: this.defaultModel, 
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }]
        }, apiKey, baseUrl);
        
        console.log('✅ Anthropic connection successful');
        return true;
    } catch (error: any) {
        console.error('❌ Anthropic connection test failed:', error.message);
        return false;
    }
}
}
