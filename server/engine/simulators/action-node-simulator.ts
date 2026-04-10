import { AIFactory } from '../../lib/ai/factory';
import { nodeSuccess, nodeError, NodeOutput, NodeMetadata } from '../types/base';
import {
  ApiCallInputSchema,
  ApiCallResult,
  AiProcessorInputSchema,
  AiProcessorResult,
} from '../types/node-contracts';

export async function simulateActionNode(
  data: unknown,
  inputValues: Record<string, unknown>
): Promise<NodeOutput<object>> {
  const t0 = Date.now();
  const d = data as any;

  // ── API Call ───────────────────────────────────────────────────────────────
  if (d?.name === 'API Call') {
    const rawInput = {
      url: inputValues['url'] ?? d.inputs?.find((i: any) => i.key === 'url')?.value ?? 'https://api.example.com',
      method: inputValues['method'] ?? d.inputs?.find((i: any) => i.key === 'method')?.value ?? 'GET',
      headers: inputValues['headers'] ?? d.inputs?.find((i: any) => i.key === 'headers')?.value ?? {},
      body: inputValues['body'] ?? d.inputs?.find((i: any) => i.key === 'body')?.value ?? {},
    };

    const validated = ApiCallInputSchema.safeParse(rawInput);
    if (!validated.success) {
      return nodeError(`API Call config invalid: ${validated.error.message}`);
    }

    const { url, method, headers, body } = validated.data;

    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));

      let simulatedResponse: unknown;
      let statusCode = 200;

      if ((url as string).includes('example.com')) {
        simulatedResponse = {
          success: true,
          data: {
            id: Math.floor(Math.random() * 10000),
            timestamp: new Date().toISOString(),
            method,
            receivedHeaders: headers,
            receivedBody: method !== 'GET' ? body : undefined,
          },
          message: 'Simulated API response',
        };
      } else if ((url as string).includes('error')) {
        statusCode = 500;
        throw new Error('API returned error status 500');
      } else {
        simulatedResponse = {
          status: 'success',
          data: { result: `Simulated response for ${url}`, timestamp: new Date().toISOString() },
        };
      }

      const meta: NodeMetadata = { executionMs: Date.now() - t0 };
      return nodeSuccess<ApiCallResult>(
        {
          response: simulatedResponse,
          statusCode,
          headers: { 'content-type': 'application/json', 'x-powered-by': 'Onhandl' },
        },
        { metadata: meta }
      );
    } catch (err: any) {
      return nodeError(
        `API call failed: ${err.message}`,
        { response: { error: err.message }, statusCode: 500, headers: {} },
        { executionMs: Date.now() - t0 }
      );
    }
  }

  // ── AI Processor ───────────────────────────────────────────────────────────
  if (d?.name === 'AI Processor') {
    const rawInput = {
      prompt: inputValues['prompt'] ?? d.inputs?.find((i: any) => i.key === 'prompt')?.value ?? '',
      model: inputValues['model'] ?? d.inputs?.find((i: any) => i.key === 'model')?.value ?? 'gemini-1.5-flash',
    };

    const validated = AiProcessorInputSchema.safeParse(rawInput);
    if (!validated.success) {
      return nodeError(`AI Processor config invalid: ${validated.error.message}`);
    }

    const { prompt, model } = validated.data;
    const provider = (model as string).includes('gpt') ? 'openai' : 'gemini';

    try {
      const aiProvider = AIFactory.getProvider(provider);
      const response = await aiProvider.generateCompletion({
        provider: provider as any,
        model: model as string,
        messages: [{ role: 'user', content: prompt as string }],
        temperature: 0.7,
      });

      const meta: NodeMetadata = { executionMs: Date.now() - t0, modelUsed: model as string };
      return nodeSuccess<AiProcessorResult>(
        { response: response.content, model: model as string },
        { confidence: 0.9, metadata: meta }
      );
    } catch (err: any) {
      return nodeError(
        `AI Processor failed: ${err.message}`,
        { response: '', model: model as string },
        { executionMs: Date.now() - t0, modelUsed: model as string }
      );
    }
  }

  return nodeError(`Unsupported action node: ${(data as any)?.name}`);
}
