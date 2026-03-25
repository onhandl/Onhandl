import { timestamp } from './base';

// Simulate input node (generates data based on configuration)
export function simulateInputNode(data: any) {
    const outputs: Record<string, any> = {};

    // For each output defined in the node
    data.outputs?.forEach((output: any) => {
        if (output.key === 'value') {
            // For text input, use the configured value or placeholder
            if (data.name === 'Text Input') {
                const inputValue =
                    data.inputs?.find((input: any) => input.key === 'placeholder')?.value || 'Sample text';
                outputs[output.key] = inputValue;
            }
            // For file upload, simulate a file object
            else if (data.name === 'File Upload') {
                outputs[output.key] = {
                    name: 'example.txt',
                    type: 'text/plain',
                    size: 1024,
                    content: 'This is a simulated file content for testing purposes.',
                };
            }
        }
        // For webhook, simulate payload data
        else if (output.key === 'payload' && data.name === 'Webhook Trigger') {
            outputs[output.key] = {
                message: 'Webhook triggered',
                timestamp: new Date().toISOString(),
                data: {
                    id: Math.floor(Math.random() * 1000),
                    event: 'user.created',
                    metadata: { source: 'simulation', version: '1.0' },
                },
            };
        }
    });

    return outputs;
}
