import { CharacterSchema } from '../../core/characters/schema';

export type MessageRole = 'system' | 'user' | 'assistant' | 'developer';

export interface CompletionMessage {
    role: MessageRole;
    content: string;
}

export interface CompletionRequest {
    provider?: 'gemini' | 'openai' | 'ollama';
    model?: string;
    messages: CompletionMessage[];
    temperature?: number;
    maxTokens?: number;
    character?: CharacterSchema;
    apiKey?: string; // Optional user-provided key
}

export interface CompletionResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: string;
}

export interface IAIProvider {
    generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
    generateStream?(request: CompletionRequest): AsyncIterableIterator<string>;
    testConnection(apiKey: string): Promise<boolean>;
}
