import { telegramTransport } from './telegram.login';
import { ENV } from '../../../shared/config/environments';

export class TelegramService {
    isConfigured(): boolean {
        return !!ENV.TELEGRAM_BOT_TOKEN;
    }

    async sendMessage(chatId: string, text: string): Promise<void> {
        const response = await telegramTransport.sendMessage(chatId, text);
        if (!response.ok) {
            throw new Error(response.description || 'Failed to send Telegram message');
        }
    }
}
