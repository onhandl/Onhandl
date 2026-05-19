import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { ENV } from '../../../shared/config/environments';
import { TelegramResponse, TelegramSendMessageOptions } from './contracts.telegram';

export interface TelegramInboundMessage {
  updateId: number;
  messageId: number;
  text: string;
  userId: string;
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export class TelegramTransport {
  private bot: Telegraf;
  private webhookStarted = false;

  constructor(botToken?: string) {
    const token = botToken || ENV.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(token);
  }

  async sendMessage(chatId: string, text: string, options: TelegramSendMessageOptions = {}): Promise<TelegramResponse> {
    try {
      const result = await this.bot.telegram.sendMessage(Number(chatId), text, options as any);
      return { ok: true, result };
    } catch (error: any) {
      return {
        ok: false,
        description: error?.description || error?.message || 'Failed to send telegram message',
        error_code: error?.code,
      };
    }
  }

  startWebhook(onMessage: (msg: TelegramInboundMessage) => Promise<void>) {
    if (this.webhookStarted) return;

    this.bot.on(message('text'), async (ctx) => {
      await onMessage({
        updateId: ctx.update.update_id,
        messageId: ctx.message.message_id,
        text: String(ctx.message.text || '').trim(),
        userId: String(ctx.from.id),
        chatId: String(ctx.chat.id),
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
    });

    this.bot.launch({
      webhook: {
        domain: ENV.TELEGRAM_WEBHOOK_DOMAIN,
        port: ENV.TELEGRAM_WEBHOOK_PORT,
        path: ENV.TELEGRAM_WEBHOOK_PATH,
        secretToken: ENV.TELEGRAM_WEBHOOK_SECRET || undefined,
      },
    });

    this.webhookStarted = true;
  }

  stopWebhook() {
    if (!this.webhookStarted) return;
    this.bot.stop();
    this.webhookStarted = false;
  }
}

export const telegramTransport = new TelegramTransport();
