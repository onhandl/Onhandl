/**
 * Telegram Bot API Service
 * This service handles interactions with the Telegram Bot API
 */

interface TelegramServiceOptions {
  botToken?: string;
  webhookUrl?: string;
}

interface TelegramSendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  reply_markup?: any;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

export class TelegramService {
  private botToken: string | null = null;
  private baseUrl = 'https://api.telegram.org/bot';
  private webhookUrl: string | null = null;

  constructor(botToken?: string, options?: TelegramServiceOptions) {
    if (botToken) {
      this.botToken = botToken;
    } else {
      // Try to get token from environment
      this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    }

    if (options?.webhookUrl) {
      this.webhookUrl = options.webhookUrl;
    }
  }

  isConfigured(): boolean {
    return !!this.botToken;
  }

  async getMe(): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/getMe`);
      return await response.json();
    } catch (error: any) {
      console.error('Error getting bot info:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
    options: TelegramSendMessageOptions = {}
  ): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      const url = `${this.baseUrl}${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          ...options,
        }),
      });

      return await response.json();
    } catch (error: any) {
      console.error('Error sending Telegram message:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  async sendPhoto(
    chatId: string,
    photo: string, // URL or file_id
    caption?: string,
    options: any = {}
  ): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      const url = `${this.baseUrl}${this.botToken}/sendPhoto`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo,
          caption,
          ...options,
        }),
      });

      return await response.json();
    } catch (error: any) {
      console.error('Error sending Telegram photo:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  async setWebhook(url: string = this.webhookUrl || ''): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    if (!url) {
      throw new Error('Webhook URL is not provided.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          allowed_updates: ['message', 'callback_query', 'inline_query'],
          drop_pending_updates: true,
        }),
      });

      return await response.json();
    } catch (error: any) {
      console.error('Error setting webhook:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  async deleteWebhook(): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/deleteWebhook`);
      return await response.json();
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  async getWebhookInfo(): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/getWebhookInfo`);
      return await response.json();
    } catch (error: any) {
      console.error('Error getting webhook info:', error);
      return {
        ok: false,
        description: error.message,
      };
    }
  }

  // Process webhook update from Telegram
  processUpdate(update: any): any {
    // Extract relevant information from update
    if (!update) return null;

    const message = update.message || update.edited_message;
    const callbackQuery = update.callback_query;

    if (message) {
      return {
        type: 'message',
        chatId: message.chat.id,
        messageId: message.message_id,
        from: {
          id: message.from.id,
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
        },
        text: message.text,
        date: message.date,
        chat: {
          id: message.chat.id,
          type: message.chat.type,
          title: message.chat.title,
        },
      };
    } else if (callbackQuery) {
      return {
        type: 'callback_query',
        id: callbackQuery.id,
        from: {
          id: callbackQuery.from.id,
          firstName: callbackQuery.from.first_name,
          lastName: callbackQuery.from.last_name,
          username: callbackQuery.from.username,
        },
        message: callbackQuery.message,
        data: callbackQuery.data,
      };
    }

    return null;
  }
}

// Create and export a default instance
export const telegramService = new TelegramService();
