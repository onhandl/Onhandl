import { allBlockchainTools } from '../../packages/tooling/blockchain/src/index';
import { executeTool } from '../../packages/tooling/blockchain/src/index';

export async function simulateBlockchainNode(data: any, inputValues: Record<string, any>, consoleOutput: string[]) {
    const outputs: Record<string, any> = {};

    try {
        const toolName = inputValues['tool_lookup'] || data.inputs?.find((input: any) => input.key === 'tool_lookup')?.value;
        const payloadStr = inputValues['payload'] || data.inputs?.find((input: any) => input.key === 'payload')?.value || '{}';

        consoleOutput.push(`[Blockchain Tool] Requested tool: ${toolName}`);

        const tool = allBlockchainTools.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`Blockchain tool not found: ${toolName}`);
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(payloadStr);
        } catch (e: any) {
            throw new Error(`Invalid JSON payload: ${e.message}`);
        }

        consoleOutput.push(`[Blockchain Tool] Executing with payload: ${JSON.stringify(parsedPayload)}`);

        // Use the strict Zod wrapper to execute
        const result = await executeTool(tool, parsedPayload);

        consoleOutput.push(`[Blockchain Tool] Execution successful.`);
        outputs['result'] = result;
        outputs['status'] = 'success';

    } catch (error: any) {
        consoleOutput.push(`[Blockchain Tool] Error: ${error.message}`);
        outputs['result'] = { error: error.message };
        outputs['status'] = 'error';
    }

    return outputs;
}
