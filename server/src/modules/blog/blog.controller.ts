import { FastifyInstance } from 'fastify';
import { BlogService } from './blog.service';

export async function blogRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: { type?: string } }>('/blog', async (request, reply) => {
        return reply.send(await BlogService.listPublished(request.query.type));
    });

    fastify.get('/blog/settings', async (_req, reply) => {
        return reply.send(await BlogService.getSettings());
    });

    fastify.get<{ Params: { id: string } }>('/blog/:id', async (request, reply) => {
        try { return reply.send(await BlogService.getById(request.params.id)); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Body: { title: string; body: string; tags?: string[] } }>(
        '/blog', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const post = await BlogService.createPost(request.user.id, request.user.username ?? '', request.body.title, request.body.body, request.body.tags ?? []);
                return reply.code(201).send(post);
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.put<{ Params: { id: string }; Body: { title?: string; body?: string; tags?: string[] } }>(
        '/blog/:id', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return reply.send(await BlogService.updatePost(request.user.id, request.params.id, request.body)); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.delete<{ Params: { id: string } }>(
        '/blog/:id', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return reply.send(await BlogService.deletePost(request.user.id, request.params.id)); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );
}
