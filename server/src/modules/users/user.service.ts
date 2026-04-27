import { UserRepository } from './user.repository';

function mask(key?: string): string | null {
    if (!key) return null;
    return `${key.slice(0, 4)}${'•'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`;
}

export const UserService = {
    async getNotifications(userId: string) {
        const record = await UserRepository.findById(userId, 'notifications');
        return (record as any)?.notifications ?? { telegram: false, whatsapp: false, dailySummaries: false, email: true };
    },

    async updateNotifications(userId: string, updates: { telegram?: boolean; whatsapp?: boolean; dailySummaries?: boolean; email?: boolean }) {
        const update: Record<string, unknown> = {};
        if (updates.telegram !== undefined) update['notifications.telegram'] = updates.telegram;
        if (updates.whatsapp !== undefined) update['notifications.whatsapp'] = updates.whatsapp;
        if (updates.dailySummaries !== undefined) update['notifications.dailySummaries'] = updates.dailySummaries;
        if (updates.email !== undefined) update['notifications.email'] = updates.email;
        await UserRepository.findByIdAndUpdate(userId, { $set: update });
        return { success: true };
    },

    async getPaymentMethods(userId: string) {
        const record = await UserRepository.findById(userId, 'savedPaymentMethods');
        const saved = (record as any)?.savedPaymentMethods || {};
        return {
            crypto: saved.crypto || [],
        };
    },

    async updatePaymentMethods(userId: string, crypto?: Array<{ label: string; network: string; walletAddress: string; asset: string }>) {
        const update: Record<string, unknown> = {};
        if (crypto !== undefined) update['savedPaymentMethods.crypto'] = crypto;
        await UserRepository.findByIdAndUpdate(userId, { $set: update });
        return { success: true };
    },

    async getApiKeys(userId: string) {
        const record = await UserRepository.findById(userId, 'apiKeys');
        const k = (record as any)?.apiKeys || {};
        return {
            gemini: mask(k.gemini), openai: mask(k.openai),
            openaiBaseUrl: k.openaiBaseUrl || '', openaiModel: k.openaiModel || '',
            ollamaBaseUrl: k.ollamaBaseUrl || '', ollamaModel: k.ollamaModel || '',
            hasGemini: !!k.gemini, hasOpenai: !!k.openai, hasOllama: !!(k.ollamaBaseUrl),
        };
    },

    async updateApiKeys(userId: string, keys: { gemini?: string; openai?: string; openaiBaseUrl?: string; openaiModel?: string; ollamaBaseUrl?: string; ollamaModel?: string }) {
        const set: Record<string, unknown> = {};
        if (keys.gemini !== undefined) set['apiKeys.gemini'] = keys.gemini;
        if (keys.openai !== undefined) set['apiKeys.openai'] = keys.openai;
        if (keys.openaiBaseUrl !== undefined) set['apiKeys.openaiBaseUrl'] = keys.openaiBaseUrl;
        if (keys.openaiModel !== undefined) set['apiKeys.openaiModel'] = keys.openaiModel;
        if (keys.ollamaBaseUrl !== undefined) set['apiKeys.ollamaBaseUrl'] = keys.ollamaBaseUrl;
        if (keys.ollamaModel !== undefined) set['apiKeys.ollamaModel'] = keys.ollamaModel;
        await UserRepository.findByIdAndUpdate(userId, { $set: set });
        return { success: true };
    },

    async getProfile(userId: string, select: string) {
        const record = await UserRepository.findById(userId, select);
        if (!record) throw Object.assign(new Error('User not found'), { code: 404 });
        return { avatarUrl: '', ...record };
    },

    async getAvatar(userId: string) {
        const record = await UserRepository.findById(userId, 'avatarUrl name username');
        if (!record) throw Object.assign(new Error('User not found'), { code: 404 });
        return { avatarUrl: (record as any).avatarUrl || null, name: (record as any).name || (record as any).username || null };
    },

    async updateProfile(userId: string, updates: { username?: string; email?: string; whatsapp?: string; avatarUrl?: string }) {
        const $set: Record<string, string> = {};
        if (updates.username) $set.username = updates.username;
        if (updates.email) $set.email = updates.email;
        if (updates.whatsapp !== undefined) $set.whatsapp = updates.whatsapp;
        if (updates.avatarUrl !== undefined) $set.avatarUrl = updates.avatarUrl;
        const record = await UserRepository.findByIdAndUpdate(userId, { $set }, { new: true });
        if (!record) throw Object.assign(new Error('User not found'), { code: 404 });
        return record;
    },
};
