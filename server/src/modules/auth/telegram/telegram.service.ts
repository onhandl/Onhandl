import { TelegramService } from '../../../infrastructure/messaging/telegram.service';
import { TelegramAuthRepository } from './telegram.repository';
import { TelegramPermissions, TelegramVerifyInput } from './telegram.types';

const telegramClient = new TelegramService();

export const TelegramAuthService = {
    async verify(userId: string, input: TelegramVerifyInput) {
        if (!input.telegramUserId || !input.chatId) {
            throw Object.assign(new Error('telegramUserId and chatId are required'), { code: 400 });
        }

        const existing = await TelegramAuthRepository.findByTelegramUserId(input.telegramUserId);
        if (existing && String((existing as any)._id) !== userId) {
            throw Object.assign(new Error('Telegram account already linked to another user'), { code: 409 });
        }

        const updated = await TelegramAuthRepository.linkTelegram(userId, {
            userId: input.telegramUserId,
            chatId: input.chatId,
            username: input.username,
            firstName: input.firstName,
            lastName: input.lastName,
        });

        if (telegramClient.isConfigured()) {
            await telegramClient.sendMessage(input.chatId, 'Telegram linked successfully. Notifications are now enabled.');
        }

        return {
            linked: true,
            telegram: (updated as any)?.telegram || null,
        };
    },

    async status(userId: string) {
        const record = await TelegramAuthRepository.getByUserId(userId) as any;
        const telegram = record?.telegram;
        return {
            linked: !!telegram?.userId,
            telegram: telegram
                ? {
                    userId: telegram.userId,
                    username: telegram.username || record?.telegramUsername || '',
                    firstName: telegram.firstName || '',
                    lastName: telegram.lastName || '',
                    linkedAt: telegram.linkedAt || null,
                    lastAuthAt: telegram.lastAuthAt || null,
                }
                : null,
            permissions: {
                notifications: !!telegram?.permissions?.notifications,
                write: !!telegram?.permissions?.write,
            },
        };
    },

    async unlink(userId: string) {
        const current = await TelegramAuthRepository.getByUserId(userId) as any;
        const chatId = current?.telegram?.chatId;
        await TelegramAuthRepository.unlinkTelegram(userId);

        if (chatId && telegramClient.isConfigured()) {
            await telegramClient.sendMessage(chatId, 'Telegram unlinked successfully. You will no longer receive notifications.');
        }

        return { success: true };
    },

    async getPermissions(userId: string): Promise<TelegramPermissions> {
        const record = await TelegramAuthRepository.getByUserId(userId) as any;
        return {
            notifications: !!record?.telegram?.permissions?.notifications,
            write: !!record?.telegram?.permissions?.write,
        };
    },

    async updatePermissions(userId: string, permissions: Partial<TelegramPermissions>) {
        const updated = await TelegramAuthRepository.updatePermissions(userId, permissions) as any;
        return {
            permissions: {
                notifications: !!updated?.telegram?.permissions?.notifications,
                write: !!updated?.telegram?.permissions?.write,
            },
        };
    },
};
