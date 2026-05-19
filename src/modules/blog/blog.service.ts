import { BlogRepository } from './blog.repository';
import { UserRepository } from '../users/user.repository';

export const BlogService = {
    async listPublished(type?: string) {
        const filter: Record<string, unknown> = { status: 'published' };
        if (type === 'official' || type === 'community') filter.postType = type;
        return BlogRepository.findPublished(filter);
    },

    async getSettings() {
        const settings = await BlogRepository.getSettings();
        return { cmsFrozen: (settings as any)?.cmsFrozen ?? false, reason: (settings as any)?.cmsFrozenReason };
    },

    async getById(id: string) {
        const post = await BlogRepository.findById(id);
        if (!post) throw Object.assign(new Error('Post not found'), { code: 404 });
        return post;
    },

    async createPost(userId: string, username: string, title: string, body: string, tags: string[]) {
        if (!title || !body) throw Object.assign(new Error('title and body are required'), { code: 400 });
        const [settings, userRecord] = await Promise.all([
            BlogRepository.getSettings(),
            UserRepository.findById(userId),
        ]);
        if ((settings as any)?.cmsFrozen && !(userRecord as any)?.isAdmin) {
            throw Object.assign(new Error('CMS is currently frozen by admin'), { code: 403 });
        }
        return BlogRepository.create({
            title, body, tags: tags ?? [],
            authorId: userId, authorName: username,
            postType: (userRecord as any)?.isAdmin ? 'official' : 'community',
            status: 'published',
        });
    },

    async updatePost(userId: string, postId: string, updates: { title?: string; body?: string; tags?: string[] }) {
        const [post, userRecord] = await Promise.all([
            BlogRepository.findByIdMutable(postId),
            UserRepository.findById(userId),
        ]);
        if (!post) throw Object.assign(new Error('Post not found'), { code: 404 });
        const isOwner = (post as any).authorId?.toString() === userId;
        if (!isOwner && !(userRecord as any)?.isAdmin) throw Object.assign(new Error('Forbidden'), { code: 403 });
        if (updates.title) (post as any).title = updates.title;
        if (updates.body) (post as any).body = updates.body;
        if (updates.tags) (post as any).tags = updates.tags;
        await (post as any).save();
        return post;
    },

    async deletePost(userId: string, postId: string) {
        const [post, userRecord] = await Promise.all([
            BlogRepository.findByIdMutable(postId),
            UserRepository.findById(userId),
        ]);
        if (!post) throw Object.assign(new Error('Post not found'), { code: 404 });
        const isOwner = (post as any).authorId?.toString() === userId;
        if (!isOwner && !(userRecord as any)?.isAdmin) throw Object.assign(new Error('Forbidden'), { code: 403 });
        await (post as any).deleteOne();
        return { success: true };
    },
};
