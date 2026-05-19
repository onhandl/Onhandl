import { FastifyInstance } from 'fastify';
import { BlogService } from './blog.service';
import {
    cookieAuthSecurity,
    idParamSchema,
    blogPostSchema,
    standardErrorResponses,
} from '../../shared/docs';

/**
 * BlogController: Public content management for articles, updates, and community news.
 */
export async function blogRoutes(fastify: FastifyInstance) {

    // GET /blog - Feed
    fastify.get<{ Querystring: { type?: string } }>('/blog', {
        schema: {
            tags: ['Blog'],
            summary: 'List published blog posts',
            description: 'Returns a feed of publicly visible blog posts. Supports filtering by post type (e.g., product updates, community stories).',
            querystring: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: 'Filter by post category' },
                },
            },
            response: {
                200: {
                    description: 'Feed of blog posts',
                    type: 'array',
                    items: blogPostSchema,
                },
                ...standardErrorResponses([500]),
            },
        },
    }, async (request) => BlogService.listPublished(request.query.type));

    // GET /blog/settings - Public metadata
    fastify.get('/blog/settings', {
        schema: {
            tags: ['Blog'],
            summary: 'Get blog settings',
            description: 'Returns configuration for the blog frontend, including categories and display metadata.',
            response: {
                200: {
                    description: 'Blog global configuration',
                    type: 'object',
                    required: ['success', 'settings'],
                    properties: {
                        success: { type: 'boolean' },
                        settings: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([500]),
            },
        },
    }, async () => {
        const settings = await BlogService.getSettings();
        return { success: true, settings };
    });

    // GET /blog/:id - Single post
    fastify.get<{ Params: { id: string } }>('/blog/:id', {
        schema: {
            tags: ['Blog'],
            summary: 'Get blog post by ID',
            description: 'Returns the full content and metadata of a specific blog post.',
            params: idParamSchema('Internal blog post ID'),
            response: {
                200: {
                    description: 'Full blog post record',
                    ...blogPostSchema,
                },
                ...standardErrorResponses([404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await BlogService.getById(request.params.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    // POST /blog - Authoring
    fastify.post<{ Body: { title: string; body: string; tags?: string[] } }>('/blog', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Create a blog post',
            description: 'Publishes a new blog post. Restricted to users with author privileges.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['title', 'body'],
                properties: {
                    title: { type: 'string', minLength: 3, maxLength: 200 },
                    body: { type: 'string', description: 'Post content (supports Markdown)' },
                    tags: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                201: {
                    description: 'Post created successfully',
                    ...blogPostSchema,
                },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.code(201).send(await BlogService.createPost(request.user.id, request.user.username ?? '', request.body.title, request.body.body, request.body.tags ?? []));
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    // PUT /blog/:id - Editing
    fastify.put<{ Params: { id: string }; Body: { title?: string; body?: string; tags?: string[] } }>('/blog/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Update a blog post',
            description: 'Modifies an existing post. Only the original author or an admin can edit.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Blog post ID'),
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                200: {
                    description: 'Post updated successfully',
                    ...blogPostSchema,
                },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await BlogService.updatePost(request.user.id, request.params.id, request.body); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    // DELETE /blog/:id - Removal
    fastify.delete<{ Params: { id: string } }>('/blog/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Delete a blog post',
            description: 'Permanently removes a post from the feed. Requires author or admin privileges.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Blog post ID'),
            response: {
                200: {
                    description: 'Post successfully deleted',
                    type: 'object',
                    properties: { success: { type: 'boolean' } },
                },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            await BlogService.deletePost(request.user.id, request.params.id);
            return { success: true };
        }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
