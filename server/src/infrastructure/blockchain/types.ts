import { z } from 'zod';

/**
 * Base error class for all Blockchain tooling operations.
 */
export class BlockchainToolError extends Error {
    constructor(public toolName: string, message: string, public details?: unknown) {
        super(`[${toolName}] Error: ${message}`);
        this.name = 'BlockchainToolError';
    }
}

/**
 * Base interface for all Blockchain Tools.
 */
export interface BlockchainTool<TInput, TOutput> {
    name: string;
    description: string;
    schema: z.ZodSchema<TInput>;
    uiSchema?: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'select' | 'radio';
        label: string;
        placeholder?: string;
        options?: string[] | Array<{ label: string; value: string }>;
    }>;
    execute(input: TInput): Promise<TOutput>;
}
