import { User } from '../../../infrastructure/database/models/User';
import { TelegramIdentity, TelegramPermissions } from './telegram.types';

export const TelegramAuthRepository = {
    async getByUserId(userId: string) {
        return User.findById(userId).select('telegram telegramUsername notifications').lean();
    },

    async findByTelegramUserId(telegramUserId: string) {
        return User.findOne({ 'telegram.userId': telegramUserId }).select('_id telegram').lean();
    },

    async linkTelegram(userId: string, identity: TelegramIdentity) {
        return User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    telegram: {
                        userId: identity.userId,
                        chatId: identity.chatId,
                        username: identity.username,
                        firstName: identity.firstName,
                        lastName: identity.lastName,
                        linkedAt: new Date(),
                        lastAuthAt: new Date(),
                        permissions: {
                            notifications: true,
                            write: true,
                        },
                    },
                    telegramUsername: identity.username || '',
                    'notifications.telegram': true,
                },
            },
            { new: true }
        ).lean();
    },

    async unlinkTelegram(userId: string) {
        return User.findByIdAndUpdate(
            userId,
            {
                $unset: { telegram: '' },
                $set: { 'notifications.telegram': false },
            },
            { new: true }
        ).lean();
    },

    async updatePermissions(userId: string, permissions: Partial<TelegramPermissions>) {
        const set: Record<string, unknown> = {};
        if (permissions.notifications !== undefined) {
            set['telegram.permissions.notifications'] = permissions.notifications;
            set['notifications.telegram'] = permissions.notifications;
        }
        if (permissions.write !== undefined) {
            set['telegram.permissions.write'] = permissions.write;
        }
        return User.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean();
    },

    async touchLastAuthByTelegramUserId(telegramUserId: string) {
        return User.findOneAndUpdate(
            { 'telegram.userId': telegramUserId },
            { $set: { 'telegram.lastAuthAt': new Date() } },
            { new: true }
        ).lean();
    },
};
