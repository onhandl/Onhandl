import { AIFactory } from '../../lib/ai/factory';

// Simulate action node (with async support for API calls)
export async function simulateActionNode(data: any, inputValues: Record<string, any>) {
    const outputs: Record<string, any> = {};

    if (data.name === 'API Call') {
        try {
            const url = inputValues['url'] || data.inputs?.find((input: any) => input.key === 'url')?.value || 'https://api.example.com';
            const method = inputValues['method'] || data.inputs?.find((input: any) => input.key === 'method')?.value || 'GET';
            const headers = inputValues['headers'] || data.inputs?.find((input: any) => input.key === 'headers')?.value || {};
            const body = inputValues['body'] || data.inputs?.find((input: any) => input.key === 'body')?.value || {};

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 800));

            let simulatedResponse;
            if (url.includes('example.com')) {
                simulatedResponse = {
                    success: true,
                    data: {
                        id: Math.floor(Math.random() * 10000),
                        timestamp: new Date().toISOString(),
                        method: method,
                        receivedHeaders: headers,
                        receivedBody: method !== 'GET' ? body : undefined,
                    },
                    message: 'Simulated API response',
                };
            } else if (url.includes('error')) {
                throw new Error('API returned error status 500');
            } else {
                simulatedResponse = {
                    status: 'success',
                    data: {
                        result: 'Simulated response for ' + url,
                        timestamp: new Date().toISOString(),
                    },
                };
            }

            outputs['response'] = simulatedResponse;
            outputs['status'] = 200;
            outputs['headers'] = { 'content-type': 'application/json', 'x-powered-by': 'FlawLess Simulator' };
        } catch (error: any) {
            outputs['response'] = { error: error.message };
            outputs['status'] = 500;
            outputs['headers'] = { 'content-type': 'application/json', 'x-error': 'true' };
        }
    } else if (data.name === 'AI Processor') {
        try {
            const prompt = inputValues['prompt'] || data.inputs?.find((input: any) => input.key === 'prompt')?.value || '';
            const model = inputValues['model'] || data.inputs?.find((input: any) => input.key === 'model')?.value || 'gemini-1.5-flash';
            const provider = model.includes('gpt') ? 'openai' : 'gemini';

            const aiProvider = AIFactory.getProvider(provider);
            const response = await aiProvider.generateCompletion({
                provider: provider as any,
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            });

            outputs['response'] = response.content;
            outputs['status'] = 200;
            outputs['fullResponse'] = response;
        } catch (error: any) {
            outputs['response'] = `Error processing with AI: ${error.message}`;
            outputs['status'] = 500;
            outputs['fullResponse'] = { error: error.message };
        }
    }

    return outputs;
}
