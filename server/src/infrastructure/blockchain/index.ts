export {  BlockchainTool } from './types';
import type { BlockchainTool } from './types';

import { z } from 'zod';
import { BlockchainToolError } from './types';

/**
 * Wrapper to automatically validate inputs against a Zod schema before executing the tool.
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
                .map((e: any) => `${e.path.join('.') || 'input'}: ${e.message}`)
                .join('; ');
            throw new BlockchainToolError(tool.name, `Input validation failed: ${detail}`, error.errors);
        }
        throw error;
    }
}

import { ckbTools, ckbFiberTools } from './ckb';

export const allBlockchainTools = [...ckbTools, ...ckbFiberTools];
