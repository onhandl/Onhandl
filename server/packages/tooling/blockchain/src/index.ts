import { z } from "zod";

/**
 * Base error class for all Blockchain tooling operations
 */
export class BlockchainToolError extends Error {
    constructor(public toolName: string, message: string, public details?: any) {
        super(`[${toolName}] Error: ${message}`);
        this.name = "BlockchainToolError";
    }
}

/**
 * Base interface for all Blockchain Tools
 */
export interface BlockchainTool<TInput, TOutput> {
    name: string;
    description: string;
    schema: z.ZodSchema<TInput>;
    uiSchema?: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'select' | 'radio',
        label: string,
        placeholder?: string,
        /** Plain string options OR label/value pairs for select/radio fields */
        options?: string[] | Array<{ label: string; value: string }>
    }>;
    execute(input: TInput): Promise<TOutput>;
}

/**
 * Wrapper to automatically validate inputs against a Zod schema before executing the tool
 */
export async function executeTool<TInput, TOutput>(
    tool: BlockchainTool<TInput, TOutput>,
    rawInput: unknown
): Promise<TOutput> {
    try {
        const validatedInput = tool.schema.parse(rawInput);
        return await tool.execute(validatedInput);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const detail = error.errors
                .map(e => `${e.path.join('.') || 'input'}: ${e.message}`)
                .join('; ');
            throw new BlockchainToolError(tool.name, `Input validation failed: ${detail}`, error.errors);
        }
        throw error;
    }
}

import { ckbTools, ckbFiberTools } from "./ckb";

// Submodules will be registered here later as they are implemented
// Other blockchains like Solana, Base, etc. can be dynamically added here.
export const allBlockchainTools = [...ckbTools, ...ckbFiberTools];
