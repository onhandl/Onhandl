import { FastifyInstance } from 'fastify';
import { BlogPost } from '../../../infrastructure/database/models/BlogPost';
import { AdminSettings } from '../../../infrastructure/database/models/AdminSettings';
import { requireAdmin } from '../admin.middleware';

export function registerBlogHandlers(fastify: FastifyInstance) {
    // GET /api/admin/blog — all posts (published + drafts)
    fastify.get('/blog', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
        return reply.send(posts);
    });

    // DELETE /api/admin/blog/:id — force-delete any post
    fastify.delete('/blog/:id', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const post = await BlogPost.findByIdAndDelete(request.params.id);
        if (!post) return reply.code(404).send({ error: 'Post not found' });
        return reply.send({ success: true });
    });

    // POST /api/admin/blog/freeze — toggle CMS freeze
    fastify.post('/blog/freeze', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const { frozen, reason } = request.body as { frozen: boolean; reason?: string };
        const settings = await AdminSettings.findOneAndUpdate(
            {},
            { cmsFrozen: frozen, cmsFrozenReason: reason ?? '' },
            { upsert: true, new: true }
        );
        return reply.send({ cmsFrozen: settings.cmsFrozen, reason: settings.cmsFrozenReason });
    });
}
