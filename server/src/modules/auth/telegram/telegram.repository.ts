import { User } from '../../../infrastructure/database/models/User';
import { TelegramIdentitySnapshot } from './telegram.types';

export const TelegramAuthRepository = {
  async findUserByTelegramUserId(telegramUserId: string) {
    return User.findOne({ 'telegram.userId': telegramUserId }).select('_id').lean();
  },

  async linkTelegramToUser(userId: string, identity: TelegramIdentitySnapshot) {
    const now = new Date();
    return User.findByIdAndUpdate(userId, {
      $set: {
        telegram: {
          userId: identity.userId,
          chatId: identity.chatId,
          username: identity.username,
          firstName: identity.firstName,
          lastName: identity.lastName,
          linkedAt: now,
          lastAuthAt: now,
        },
        'notifications.telegram': true,
      },
    }, { new: true }).lean();
  },

  async unlinkByTelegramUserId(telegramUserId: string) {
    return User.updateOne(
      { 'telegram.userId': telegramUserId },
      { $unset: { telegram: 1 }, $set: { 'notifications.telegram': false } }
    );
  },

  async unlinkByUserId(userId: string) {
    return User.findByIdAndUpdate(userId, {
      $unset: { telegram: 1 },
      $set: { 'notifications.telegram': false },
    }, { new: true }).lean();
  },

  async getSafeTelegramProfileByUserId(userId: string) {
    const user = await User.findById(userId).select('telegram').lean();
    const tg = (user as any)?.telegram;
    if (!tg) return { linked: false };
    return {
      linked: true,
      username: tg.username,
      firstName: tg.firstName,
      lastName: tg.lastName,
      linkedAt: tg.linkedAt,
      lastAuthAt: tg.lastAuthAt,
    };
  },
};
