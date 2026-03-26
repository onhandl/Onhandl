import { AIFactory } from '../../lib/ai/factory';
import { timestamp } from './base';

// Simulate processing node
export async function simulateProcessingNode(
    data: any,
    inputValues: Record<string, any>,
    consoleOutput: string[],
    agent?: any
) {
    const outputs: Record<string, any> = {};

    if (data.name === 'Text Processor') {
        const inputText =
            inputValues['text'] ||
            data.inputs?.find((input: any) => input.key === 'text')?.value ||
            'Default text';

        // Prioritize: Agent Config > Node Data > Defaults
        const provider = agent?.modelProvider || data.modelProvider || 'ollama';
        const model = agent?.modelConfig?.modelName || data.inputs?.find((input: any) => input.key === 'model')?.value || 'qwen2.5:3b';

        consoleOutput.push(`${timestamp()} Connecting to ${provider.toUpperCase()} API for ${model}...`);

        try {
            const aiProvider = AIFactory.getProvider(provider);

            const response = await aiProvider.generateCompletion({
                provider: provider as any,
                model,
                messages: [{ role: 'user', content: inputText }],
                temperature: 0.7,
            });

            consoleOutput.push(`${timestamp()} Received response from ${model}`);

            outputs['result'] = response.content;
            outputs['model'] = response.model;
            outputs['tokenUsage'] = response.usage;
        } catch (error: any) {
            consoleOutput.push(`${timestamp()} Error: ${error.message}`);
            outputs['result'] = `Error: ${error.message}`;
            outputs['error'] = error.message;
            throw error;
        }
    } else if (data.name === 'Data Transformer') {
        const inputData = inputValues['data'] || data.inputs?.find((input: any) => input.key === 'data')?.value || {};
        const transformationType = data.inputs?.find((input: any) => input.key === 'transformation')?.value || 'default';

        try {
            let transformedData;
            if (Array.isArray(inputData)) {
                if (transformationType.includes('map')) {
                    transformedData = inputData.map(item => (typeof item === 'object' ? { ...item, processed: true } : item));
                } else if (transformationType.includes('filter')) {
                    transformedData = inputData.filter(item => typeof item === 'object' && item !== null);
                } else {
                    transformedData = [...inputData];
                }
            } else if (typeof inputData === 'object' && inputData !== null) {
                transformedData = { ...inputData, processed: true, timestamp: new Date().toISOString() };
            } else {
                transformedData = { originalValue: inputData, processed: true, timestamp: new Date().toISOString() };
            }
            outputs['result'] = transformedData;
        } catch (error: any) {
            outputs['result'] = { error: `Transformation error: ${error.message}`, originalData: inputData };
        }
    }

    return outputs;
}
