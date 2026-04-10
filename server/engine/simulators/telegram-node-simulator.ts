import { telegramService } from '../../services/telegram-service';
import { nodeSuccess, nodeError, NodeOutput } from '../types/base';
import { TelegramInputSchema, TelegramResult } from '../types/node-contracts';
import { timestamp } from './base';

export async function simulateTelegramSendMessage(
  data: unknown,
  inputValues: Record<string, unknown>,
  consoleOutput: string[]
): Promise<NodeOutput<TelegramResult>> {
  const t0 = Date.now();
  const d = data as any;

  const rawInput = {
    chatId:
      inputValues['chatId'] ?? d?.inputs?.find((i: any) => i.key === 'chatId')?.value,
    message:
      (inputValues['message'] as string) ??
      d?.inputs?.find((i: any) => i.key === 'message')?.value ??
      'Hello from Onhandl!',
  };

  const validated = TelegramInputSchema.safeParse(rawInput);
  if (!validated.success) {
    const msg = `Telegram node input invalid: ${validated.error.message}`;
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  const { chatId, message } = validated.data;

  consoleOutput.push(`${timestamp()} 📤 Sending Telegram message to chat ${chatId}...`);

  try {
    const response = await telegramService.sendMessage(String(chatId), message as string);

    if (response.ok) {
      consoleOutput.push(`${timestamp()} ✅ Telegram message sent successfully`);
      return nodeSuccess<TelegramResult>(
        {
          messageId: response.result?.message_id ?? 0,
          chatId,
          sentAt: new Date().toISOString(),
        },
        { startedAt: t0, message: 'Message delivered' }
      );
    }

    const errMsg = response.description ?? 'Telegram API returned not-ok';
    consoleOutput.push(`${timestamp()} ❌ Telegram API error: ${errMsg}`);
    return nodeError(errMsg, {}, { executionMs: Date.now() - t0 });
  } catch (err: any) {
    consoleOutput.push(`${timestamp()} ❌ Telegram error: ${err.message}`);
    throw err;
  }
}
