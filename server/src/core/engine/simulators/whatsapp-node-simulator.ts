import { whatsAppService } from '../../../infrastructure/messaging/whatsapp.service';
import { nodeSuccess, nodeError, NodeOutput, NodeMetadata } from '../../contracts/base';
import { z } from 'zod';
import { timestamp } from './base';

const WhatsAppInputSchema = z.object({
  phoneNumber: z.union([z.string(), z.number()]),
  message: z.string().min(1, 'Message is required'),
}).passthrough();

interface WhatsAppResult {
  messageId?: string;
  phoneNumber: string | number;
  sentAt: string;
}

export async function simulateWhatsAppSendMessage(
  data: unknown,
  inputValues: Record<string, unknown>,
  consoleOutput: string[]
): Promise<NodeOutput<WhatsAppResult>> {
  const t0 = Date.now();
  const d = data as { inputs?: Array<{ key: string; value: unknown }> };

  const rawInput = {
    phoneNumber:
      inputValues['phoneNumber'] ?? d?.inputs?.find(i => i.key === 'phoneNumber')?.value,
    message:
      inputValues['message'] ??
      d?.inputs?.find(i => i.key === 'message')?.value ??
      inputValues['text'] ??
      inputValues['result'],
  };

  const validated = WhatsAppInputSchema.safeParse(rawInput);
  if (!validated.success) {
    const msg = `WhatsApp node input invalid: ${validated.error.message}`;
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  const { phoneNumber, message } = validated.data;

  consoleOutput.push(`${timestamp()} 📤 Sending WhatsApp message to ${phoneNumber}...`);

  try {
    const response = await whatsAppService.sendTextMessage(String(phoneNumber), message as string);
    consoleOutput.push(`${timestamp()} ✅ WhatsApp message sent successfully`);

    return nodeSuccess<WhatsAppResult>(
      {
        messageId: response?.messages?.[0]?.id,
        phoneNumber,
        sentAt: new Date().toISOString(),
      },
      { startedAt: t0, message: 'Message delivered via WhatsApp Cloud API' }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const meta: NodeMetadata = { executionMs: Date.now() - t0 };
    return nodeError(`WhatsApp error: ${msg}`, undefined, meta);
  }
}
