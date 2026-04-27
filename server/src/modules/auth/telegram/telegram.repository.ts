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
    const now = new Date();
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
            linkedAt: now,
            lastAuthAt: now,
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

  async unlinkByTelegramUserId(telegramUserId: string) {
    return User.updateOne(
      { 'telegram.userId': telegramUserId },
      { $unset: { telegram: 1 }, $set: { 'notifications.telegram': false } }
    );
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

  async getSafeTelegramProfileByUserId(userId: string) {
    const user = await User.findById(userId).select('telegram').lean();
    const tg = (user as any)?.telegram;
    // Only consider it 'linked' if we have a valid telegram userId AND username
    if (!tg || !tg.userId || !tg.username) return { linked: false };
    return {
      linked: true,
      username: tg.username || 'User',
      firstName: tg.firstName || '',
      lastName: tg.lastName || '',
      linkedAt: tg.linkedAt || null,
      lastAuthAt: tg.lastAuthAt || null,
      permissions: {
        notifications: !!tg.permissions?.notifications,
        write: !!tg.permissions?.write,
      },
    };
  },
};
