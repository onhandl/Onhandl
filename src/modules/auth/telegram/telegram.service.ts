import { telegramTransport, TelegramInboundMessage } from '../../../infrastructure/messaging/telegram/telegram.login';
import { TelegramAuthRepository } from './telegram.repository';
import { telegramSessionStore } from './telegram-session.store';
import { TelegramPermissions } from './telegram.types';

class TelegramAuthServiceClass {
  private webhookStarted = false;

  startWebhook() {
    if (this.webhookStarted) return;
    this.webhookStarted = true;
    telegramTransport.startWebhook(async (message) => {
      await this.handleInboundMessage(message);
    });
  }

  private async handleInboundMessage(message: TelegramInboundMessage) {
    if (message.text === '/logout') {
      telegramSessionStore.terminate(message.userId);
      await TelegramAuthRepository.unlinkByTelegramUserId(message.userId);
      await telegramTransport.sendMessage(message.chatId, '✅ You have been logged out. Send /login to verify again.');
      return;
    }

    const existing = telegramSessionStore.getSessionByTelegramUserId(message.userId);
    if (existing?.state === 'authenticated') {
      telegramSessionStore.touchAuthenticated(message.userId);
      return;
    }

    const code = telegramSessionStore.issueCode({
      userId: message.userId,
      chatId: message.chatId,
      username: message.username,
      firstName: message.firstName,
      lastName: message.lastName,
    });

    await telegramTransport.sendMessage(
      message.chatId,
      `🔐 Your Onhandl verification code is: *${code}*\n\nEnter this code in the app to verify Telegram.\nThis code expires in 5 minutes.`,
      { parse_mode: 'Markdown' }
    );
  }

  async verifyCodeForUser(userId: string, code: string) {
    const identity = telegramSessionStore.verifyCode(code, userId);

    const owner = await TelegramAuthRepository.findByTelegramUserId(identity.userId);
    if (owner && String((owner as any)._id) !== userId) {
      throw Object.assign(new Error('This Telegram account is already linked to another user'), { code: 409 });
    }

    const updated = await TelegramAuthRepository.linkTelegram(userId, identity);
    telegramSessionStore.markAuthenticated(identity.userId);
    await telegramTransport.sendMessage(identity.chatId, '✅ Welcome to Onhandl. Telegram verification successful.');

    return {
      success: true,
      telegram: {
        linked: true,
        username: (updated as any)?.telegram?.username,
        firstName: (updated as any)?.telegram?.firstName,
        lastName: (updated as any)?.telegram?.lastName,
        linkedAt: (updated as any)?.telegram?.linkedAt,
        lastAuthAt: (updated as any)?.telegram?.lastAuthAt,
      },
    };
  }

  async getStatus(userId: string) {
    return TelegramAuthRepository.getSafeTelegramProfileByUserId(userId);
  }

  async unlink(userId: string) {
    const current = await TelegramAuthRepository.getByUserId(userId) as any;
    const telegramUserId = current?.telegram?.userId;
    const chatId = current?.telegram?.chatId;

    await TelegramAuthRepository.unlinkTelegram(userId);

    if (telegramUserId) telegramSessionStore.terminate(telegramUserId);
    if (chatId) await telegramTransport.sendMessage(String(chatId), '✅ Your Telegram account has been unlinked from Onhandl.');

    return { success: true };
  }

  async getPermissions(userId: string): Promise<TelegramPermissions> {
    const record = await TelegramAuthRepository.getByUserId(userId) as any;
    return {
      notifications: !!record?.telegram?.permissions?.notifications,
      write: !!record?.telegram?.permissions?.write,
    };
  }

  async updatePermissions(userId: string, permissions: Partial<TelegramPermissions>) {
    const updated = await TelegramAuthRepository.updatePermissions(userId, permissions) as any;
    return {
      permissions: {
        notifications: !!updated?.telegram?.permissions?.notifications,
        write: !!updated?.telegram?.permissions?.write,
      },
    };
  }
}

export const TelegramAuthService = new TelegramAuthServiceClass();
