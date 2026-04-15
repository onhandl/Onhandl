import { nodeSuccess, nodeError, NodeOutput, NodeMetadata } from '../../contracts/base';
import {
  ProcessingNodeInputSchema,
  FinancialProcessorResult,
  SocialProcessorResult,
  OperationalProcessorResult,
  GeneralProcessorResult,
  DataTransformerResult,
} from '../../contracts/node-contracts';
import { ProcessorContext, BaseProcessor } from '../processors/base-processor';
import { CKBProcessor } from '../processors/financial/ckb-processor';
import { SocialProcessor } from '../processors/social/social-processor';
import { OperationalProcessor } from '../processors/operational/operational-processor';
import { timestamp } from './base';

export async function simulateProcessingNode(
  data: unknown,
  inputValues: Record<string, unknown>,
  consoleOutput: string[],
  agent?: unknown
): Promise<NodeOutput<object>> {
  const t0 = Date.now();
  const d = data as any;
  const nodeName: string = d?.name ?? '';

  const parsed = ProcessingNodeInputSchema.safeParse(inputValues);
  if (!parsed.success) {
    return nodeError(`Processing node input invalid: ${parsed.error.message}`);
  }

  // ── Data Transformer ───────────────────────────────────────────────────────
  if (nodeName === 'Data Transformer') {
    const inputData =
      inputValues['data'] ??
      d.inputs?.find((i: any) => i.key === 'data')?.value ??
      {};
    const transformationType: string =
      (d.inputs?.find((i: any) => i.key === 'transformation')?.value as string) ?? 'default';

    try {
      let transformed: unknown;
      if (Array.isArray(inputData)) {
        if (transformationType.includes('map')) {
          transformed = (inputData as unknown[]).map(item =>
            typeof item === 'object' && item !== null ? { ...(item as object), processed: true } : item
          );
        } else if (transformationType.includes('filter')) {
          transformed = (inputData as unknown[]).filter(
            item => typeof item === 'object' && item !== null
          );
        } else {
          transformed = [...(inputData as unknown[])];
        }
      } else if (typeof inputData === 'object' && inputData !== null) {
        transformed = { ...(inputData as object), processed: true, processedAt: new Date().toISOString() };
      } else {
        transformed = { originalValue: inputData, processed: true, processedAt: new Date().toISOString() };
      }

      return nodeSuccess<DataTransformerResult>(
        { transformed, inputType: Array.isArray(inputData) ? 'array' : typeof inputData },
        { startedAt: t0 }
      );
    } catch (err: any) {
      return nodeError(`Transformation error: ${err.message}`, { inputType: typeof inputData });
    }
  }

  // ── AI Processor nodes ─────────────────────────────────────────────────────
  if (nodeName.includes('Processor') || nodeName === 'AI Text Analyzer') {
    const inputText =
      (inputValues['text'] as string) ||
      (d.inputs?.find((i: any) => i.key === 'text')?.value as string) ||
      '';

    const ctx: ProcessorContext = { agent, inputValues, consoleOutput };

    try {
      if (nodeName === 'Financial Processor') {
        const raw = await CKBProcessor.execute(ctx, inputText);
        const meta: NodeMetadata = {
          executionMs: Date.now() - t0,
          modelUsed: (agent as any)?.modelConfig?.modelName,
        };
        return nodeSuccess<FinancialProcessorResult>(
          {
            intent: raw.intent ?? 'unknown',
            message: raw.message ?? '',
            amount: raw.amount,
            address: raw.address,
            parameters: raw.result ?? raw,
          },
          { confidence: 0.9, metadata: meta }
        );
      }

      if (nodeName === 'Social Processor') {
        const raw = await SocialProcessor.execute(ctx, inputText);
        const meta: NodeMetadata = {
          executionMs: Date.now() - t0,
          modelUsed: (agent as any)?.modelConfig?.modelName,
        };
        return nodeSuccess<SocialProcessorResult>(
          {
            intent: raw.intent ?? 'unknown',
            tone: raw.tone ?? 'neutral',
            message: raw.message ?? '',
            analysis: raw.result ?? raw,
          },
          { confidence: 0.9, metadata: meta }
        );
      }

      if (nodeName === 'Operational Processor') {
        const raw = await OperationalProcessor.execute(ctx, inputText);
        const meta: NodeMetadata = {
          executionMs: Date.now() - t0,
          modelUsed: (agent as any)?.modelConfig?.modelName,
        };
        return nodeSuccess<OperationalProcessorResult>(
          {
            intent: raw.intent ?? 'unknown',
            task: raw.task ?? '',
            schedule: raw.schedule ?? '',
            message: raw.message ?? '',
            plan: raw.result ?? raw,
          },
          { confidence: 0.9, metadata: meta }
        );
      }

      // General AI Text Analyzer
      const provider = (agent as any)?.modelProvider || 'ollama';
      const model = (agent as any)?.modelConfig?.modelName || 'qwen2.5:3b';
      const systemPrompt = `${BaseProcessor.getIdentityContext(agent)}\n\nGeneral Text Analysis:\nIdentify intent and provide a direct reply.\nReturn ONLY valid JSON: { "intent": "general", "message": "..." }`;
      const response = await BaseProcessor.getCompletion(provider, model, systemPrompt, inputText);
      const parsed = BaseProcessor.parseJsonResponse(response.content, consoleOutput) as any;

      const meta: NodeMetadata = {
        executionMs: Date.now() - t0,
        modelUsed: model,
      };

      return nodeSuccess<GeneralProcessorResult>(
        {
          intent: parsed?.intent ?? 'general',
          message: parsed?.message ?? response.content,
          raw: parsed ?? {},
        },
        { confidence: 0.85, metadata: meta }
      );
    } catch (err: any) {
      consoleOutput.push(`${timestamp()} ❌ Processor error: ${err.message}`);
      return nodeError(`Processor failed: ${err.message}`, {}, { executionMs: Date.now() - t0 });
    }
  }

  return nodeError(`Unknown processing node: ${nodeName}`);
}
