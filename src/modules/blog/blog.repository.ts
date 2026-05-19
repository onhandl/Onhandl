import { BlogPost } from '../../infrastructure/database/models/BlogPost';
import { AdminSettings } from '../../infrastructure/database/models/AdminSettings';

export const BlogRepository = {
    async findPublished(filter: Record<string, unknown>) {
        return BlogPost.find(filter).sort({ createdAt: -1 }).lean();
    },
    async findById(id: string) {
        return BlogPost.findById(id).lean();
    },
    async findByIdMutable(id: string) {
        return BlogPost.findById(id);
    },
    async create(data: Record<string, unknown>) {
        return BlogPost.create(data);
    },
    async getSettings() {
        return AdminSettings.findOne().lean();
    },
};
