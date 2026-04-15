import { AIFactory } from '../../../infrastructure/ai/factory';
import { nodeSuccess, nodeError, NodeOutput, NodeMetadata } from '../../contracts/base';
import {
  ApiCallInputSchema,
  ApiCallResult,
  AiProcessorInputSchema,
  AiProcessorResult,
} from '../../contracts/node-contracts';

export async function simulateActionNode(
  data: unknown,
  inputValues: Record<string, unknown>
): Promise<NodeOutput<object>> {
  const t0 = Date.now();
  const d = data as { name?: string; inputs?: Array<{ key: string; value: unknown }> };

  // ── API Call ───────────────────────────────────────────────────────────────
  if (d?.name === 'API Call') {
    const rawInput = {
      url: inputValues['url'] ?? d.inputs?.find(i => i.key === 'url')?.value ?? 'https://api.example.com',
      method: inputValues['method'] ?? d.inputs?.find(i => i.key === 'method')?.value ?? 'GET',
      headers: inputValues['headers'] ?? d.inputs?.find(i => i.key === 'headers')?.value ?? {},
      body: inputValues['body'] ?? d.inputs?.find(i => i.key === 'body')?.value ?? {},
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return nodeError(
        `API call failed: ${msg}`,
        { response: { error: msg }, statusCode: 500, headers: {} },
        { executionMs: Date.now() - t0 }
      );
    }
  }

  // ── AI Processor ───────────────────────────────────────────────────────────
  if (d?.name === 'AI Processor') {
    const rawInput = {
      prompt: inputValues['prompt'] ?? d.inputs?.find(i => i.key === 'prompt')?.value ?? '',
      model: inputValues['model'] ?? d.inputs?.find(i => i.key === 'model')?.value ?? 'gemini-1.5-flash',
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
        provider: provider as 'openai' | 'gemini',
        model: model as string,
        messages: [{ role: 'user', content: prompt as string }],
        temperature: 0.7,
      });

      const meta: NodeMetadata = { executionMs: Date.now() - t0, modelUsed: model as string };
      return nodeSuccess<AiProcessorResult>(
        { response: response.content, model: model as string },
        { confidence: 0.9, metadata: meta }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return nodeError(
        `AI Processor failed: ${msg}`,
        { response: '', model: model as string },
        { executionMs: Date.now() - t0, modelUsed: model as string }
      );
    }
  }

  return nodeError(`Unsupported action node: ${d?.name}`);
}
