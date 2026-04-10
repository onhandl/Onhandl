import { nodeSuccess, nodeError, NodeOutput } from '../types/base';
import { InputNodeInputSchema, InputNodeResult } from '../types/node-contracts';

/**
 * Input node simulator.
 *
 * The Input node is a pure passthrough — no model, no tool.
 * It takes the user-supplied `value` and forwards it downstream as-is.
 *
 * Input priority (highest → lowest):
 *   1. inputValues.value  — provided by upstream node or simulation override
 *   2. data.inputs[value] — the node's configured Default Value
 *   3. data.inputs[placeholder] — fallback hint text (never empty string)
 */
export function simulateInputNode(data: unknown, inputValues?: Record<string, unknown>): NodeOutput<InputNodeResult> {
  const t0 = Date.now();
  const d = data as any;
  const nodeName: string = d?.name ?? 'Text Input';

  // Resolve the actual text value
  const runtimeValue =
    (inputValues?.['value'] as string | undefined) ||
    (d?.inputs?.find((i: any) => i.key === 'value')?.value as string | undefined) ||
    (d?.inputs?.find((i: any) => i.key === 'placeholder')?.value as string | undefined) ||
    '';

  const label: string =
    (d?.inputs?.find((i: any) => i.key === 'label')?.value as string | undefined) ||
    'User Message';

  if (nodeName === 'Text Input') {
    if (!runtimeValue) {
      return nodeError<InputNodeResult>('Text Input has no value. Set a Default Value or provide input at runtime.');
    }
    return nodeSuccess<InputNodeResult>(
      { value: runtimeValue, inputType: 'text', label },
      { startedAt: t0, message: `Received: "${String(runtimeValue).substring(0, 60)}${String(runtimeValue).length > 60 ? '…' : ''}"` }
    );
  }

  if (nodeName === 'File Upload') {
    return nodeSuccess<InputNodeResult>(
      {
        value: {
          name: 'example.txt',
          type: 'text/plain',
          size: 1024,
          content: 'Simulated file content.',
        },
        inputType: 'file',
        label: 'File Upload',
      },
      { startedAt: t0 }
    );
  }

  if (nodeName === 'Webhook Trigger') {
    return nodeSuccess<InputNodeResult>(
      {
        value: {
          message: 'Webhook triggered',
          timestamp: new Date().toISOString(),
          data: {
            id: Math.floor(Math.random() * 1000),
            event: 'user.created',
            metadata: { source: 'onhandl', version: '2.0' },
          },
        },
        inputType: 'webhook',
        label: 'Webhook Trigger',
      },
      { startedAt: t0 }
    );
  }

  return nodeError(`Unsupported input node name: ${nodeName}`);
}
