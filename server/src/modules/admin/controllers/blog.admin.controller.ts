import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';
import {
    cookieAuthSecurity,
    idParamSchema,
    blogPostSchema,
    standardErrorResponses,
} from '../../../shared/docs';

/**
 * BlogAdminHandlers: Content moderation and CMS maintenance.
 */
export function registerBlogHandlers(fastify: FastifyInstance) {
    // GET /api/admin/blog — all posts
    fastify.get('/blog', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List all posts (Admin)',
            description: 'Returns all blog posts including drafts and hidden updates.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'All blog posts', type: 'array', items: blogPostSchema },
                ...standardErrorResponses([401, 403]),
            },
        },
    }, async () => AdminService.listBlogPosts());

    // DELETE /api/admin/blog/:id — force-delete
    fastify.delete<{ Params: { id: string } }>('/blog/:id', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'Force delete post (Admin)',
            description: 'Permanently removes any blog post. Restricted to administrators.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Blog post ID'),
            response: {
                200: { description: 'Post deleted', type: 'object', properties: { success: { type: 'boolean' } } },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            await AdminService.deleteBlogPost(request.params.id);
            return { success: true };
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // POST /api/admin/blog/freeze — CMS lockdown
    fastify.post<{ Body: { frozen: boolean; reason?: string } }>(
        '/blog/freeze',
        {
            onRequest: [fastify.authorizeAdmin],
            schema: {
                tags: ['Admin'],
                summary: 'Freeze CMS publishing',
                description: 'Prevents any new blog posts or edits globally. Used for maintenance or security incidents.',
                security: [cookieAuthSecurity],
                body: {
                    type: 'object',
                    required: ['frozen'],
                    properties: {
                        frozen: { type: 'boolean' },
                        reason: { type: 'string' },
                    },
                },
                response: {
                    200: { description: 'CMS status updated', type: 'object', properties: { frozen: { type: 'boolean' } } },
                    ...standardErrorResponses([401, 403]),
                },
            },
        },
        async (request) => {
            const { frozen, reason } = request.body;
            return AdminService.freezeCms(frozen, reason);
        }
    );
}
