import { FastifyInstance } from 'fastify';
import { BlogPost } from '../../infrastructure/database/models/BlogPost';
import { AdminSettings } from '../../infrastructure/database/models/AdminSettings';
import { User } from '../../infrastructure/database/models/User';

async function verifyAuth(request: any, reply: any, fastify: FastifyInstance) {
    const token = request.cookies['auth_token'];
    if (!token) { reply.code(401).send({ error: 'Unauthorized' }); return null; }
    try { return fastify.jwt.verify(token) as { id: string; username: string }; }
    catch { reply.code(401).send({ error: 'Invalid token' }); return null; }
}

export async function blogRoutes(fastify: FastifyInstance) {
    // GET /api/blog?type=official|community — list published posts (optional type filter)
    fastify.get('/blog', async (request: any, reply) => {
        const filter: Record<string, any> = { status: 'published' };
        if (request.query.type === 'official' || request.query.type === 'community') {
            filter.postType = request.query.type;
        }
        const posts = await BlogPost.find(filter)
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(posts);
    });

    // GET /api/blog/settings — get CMS settings (frozen status)
    fastify.get('/blog/settings', async (_req, reply) => {
        const settings = await AdminSettings.findOne().lean();
        return reply.send({ cmsFrozen: settings?.cmsFrozen ?? false, reason: settings?.cmsFrozenReason });
    });

    // GET /api/blog/:id — single post
    fastify.get('/blog/:id', async (request: any, reply) => {
        const post = await BlogPost.findById(request.params.id).lean();
        if (!post) return reply.code(404).send({ error: 'Post not found' });
        return reply.send(post);
    });

    // POST /api/blog — create post (authenticated)
    fastify.post('/blog', async (request: any, reply) => {
        const decoded = await verifyAuth(request, reply, fastify);
        if (!decoded) return;

        const settings = await AdminSettings.findOne().lean();
        const user = await User.findById(decoded.id).lean();
        if (settings?.cmsFrozen && !user?.isAdmin) {
            return reply.code(403).send({ error: 'CMS is currently frozen by admin' });
        }

        const { title, body, tags } = request.body as any;
        if (!title || !body) return reply.code(400).send({ error: 'title and body are required' });

        const post = await BlogPost.create({
            title,
            body,
            tags: tags ?? [],
            authorId: decoded.id,
            authorName: decoded.username,
            postType: user?.isAdmin ? 'official' : 'community',
            status: 'published',
        });
        return reply.code(201).send(post);
    });

    // PUT /api/blog/:id — update post (author or admin)
    fastify.put('/blog/:id', async (request: any, reply) => {
        const decoded = await verifyAuth(request, reply, fastify);
        if (!decoded) return;

        const post = await BlogPost.findById(request.params.id);
        if (!post) return reply.code(404).send({ error: 'Post not found' });

        const user = await User.findById(decoded.id).lean();
        const isOwner = post.authorId.toString() === decoded.id;
        if (!isOwner && !user?.isAdmin) return reply.code(403).send({ error: 'Forbidden' });

        const { title, body, tags } = request.body as any;
        if (title) post.title = title;
        if (body) post.body = body;
        if (tags) post.tags = tags;
        await post.save();
        return reply.send(post);
    });

    // DELETE /api/blog/:id — delete (author or admin)
    fastify.delete('/blog/:id', async (request: any, reply) => {
        const decoded = await verifyAuth(request, reply, fastify);
        if (!decoded) return;

        const post = await BlogPost.findById(request.params.id);
        if (!post) return reply.code(404).send({ error: 'Post not found' });

        const user = await User.findById(decoded.id).lean();
        const isOwner = post.authorId.toString() === decoded.id;
        if (!isOwner && !user?.isAdmin) return reply.code(403).send({ error: 'Forbidden' });

        await post.deleteOne();
        return reply.send({ success: true });
    });
}
