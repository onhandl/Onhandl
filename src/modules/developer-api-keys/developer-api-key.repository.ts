import { DeveloperApiKey, IDeveloperApiKey } from '../../infrastructure/database/models/DeveloperApiKey';

export const DeveloperApiKeyRepository = {
    async create(data: Partial<IDeveloperApiKey>) {
        return DeveloperApiKey.create(data);
    },

    async findByPrefix(prefix: string) {
        return DeveloperApiKey.find({ keyPrefix: prefix, isActive: true });
    },

    async findByUserId(userId: string) {
        return DeveloperApiKey.find({ userId }).sort({ createdAt: -1 });
    },

    async findById(id: string) {
        return DeveloperApiKey.findById(id);
    },

    async update(id: string, data: Partial<IDeveloperApiKey>) {
        return DeveloperApiKey.findByIdAndUpdate(id, data, { new: true });
    },

    async delete(id: string) {
        return DeveloperApiKey.findByIdAndDelete(id);
    }
};
