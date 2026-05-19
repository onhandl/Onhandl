import { financialAgentSchema } from '../../core/financial-runtime/Schema/financial.schema';
import { ENV } from '../../shared/config/environments';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type MessageRole = 'system' | 'user' | 'assistant' | 'developer';

export interface CompletionMessage {
    role: MessageRole;
    content: string;
}

export const OpenAIClient = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  baseURL: ENV.OPENAI_BASE_URL, 
});

const AnthropicClient = new Anthropic({
    apiKey: ENV.ANTHROPIC_API_KEY,
    baseURL: ENV.ANTHROPIC_BASE_URL,
});

const OllamaClient = {
    apiKey: ENV.OLLAMA_API_KEY,
    baseURL: ENV.OLLAMA_BASE_URL,
};

export interface CompletionRequest {
    provider?: 'gemini' | 'openai' | 'ollama' | 'anthropic';
    model?: string;
    messages: CompletionMessage[];
    temperature?: number;
    maxTokens?: number;
    character?: typeof financialAgentSchema;
    apiKey?: string;
    baseUrl?: string;
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
    testConnection(apiKey: string, baseUrl?: string): Promise<boolean>;
}
