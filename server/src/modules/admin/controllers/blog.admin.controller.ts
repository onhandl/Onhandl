import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';

export function registerBlogHandlers(fastify: FastifyInstance) {
    // GET /api/admin/blog — all posts (published + drafts)
    fastify.get('/blog', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listBlogPosts();
    });

    // DELETE /api/admin/blog/:id — force-delete any post
    fastify.delete<{ Params: { id: string } }>('/blog/:id', { onRequest: [fastify.authorizeAdmin] }, async (request, reply) => {
        try {
            return await AdminService.deleteBlogPost(request.params.id);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // POST /api/admin/blog/freeze — toggle CMS freeze
    fastify.post<{ Body: { frozen: boolean; reason?: string } }>(
        '/blog/freeze',
        { onRequest: [fastify.authorizeAdmin] },
        async (request) => {
            const { frozen, reason } = request.body;
            return AdminService.freezeCms(frozen, reason);
        }
    );
}
