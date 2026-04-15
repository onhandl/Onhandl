import { FastifyInstance } from 'fastify';
import { BlogService } from './blog.service';
import { cookieAuthSecurity, idParamSchema, standardErrorResponses } from '../../shared/docs';

export async function blogRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: { type?: string } }>('/blog', {
        schema: {
            tags: ['Blog'],
            summary: 'List published blog posts',
            description: 'Returns all published posts, optionally filtered by type (e.g. article, update).',
            querystring: {
                type: 'object',
                properties: { type: { type: 'string', description: 'Filter by post type' } },
            },
            response: {
                200: { description: 'Published posts', type: 'array', items: { type: 'object', additionalProperties: true } },
            },
        },
    }, async (request, reply) => reply.send(await BlogService.listPublished(request.query.type)));

    fastify.get('/blog/settings', {
        schema: {
            tags: ['Blog'],
            summary: 'Get blog settings',
            description: 'Returns global blog configuration (display options, categories, etc.).',
            response: {
                200: { description: 'Blog settings', type: 'object', additionalProperties: true },
            },
        },
    }, async (_req, reply) => reply.send(await BlogService.getSettings()));

    fastify.get<{ Params: { id: string } }>('/blog/:id', {
        schema: {
            tags: ['Blog'],
            summary: 'Get blog post by ID',
            description: 'Returns a single blog post by ID.',
            params: idParamSchema('Blog post ID'),
            response: {
                200: { description: 'Blog post', type: 'object', additionalProperties: true },
                ...standardErrorResponses([404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return reply.send(await BlogService.getById(request.params.id)); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Body: { title: string; body: string; tags?: string[] } }>('/blog', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Create a blog post',
            description: 'Creates a new published blog post. Requires authentication.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['title', 'body'],
                properties: {
                    title: { type: 'string', minLength: 3, maxLength: 200 },
                    body: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                201: { description: 'Post created', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.code(201).send(await BlogService.createPost(request.user.id, request.user.username ?? '', request.body.title, request.body.body, request.body.tags ?? []));
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.put<{ Params: { id: string }; Body: { title?: string; body?: string; tags?: string[] } }>('/blog/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Update a blog post',
            description: 'Updates an existing blog post. Only the original author can update their post.',
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
                200: { description: 'Updated post', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    }, async (request, reply) => {
        try { return reply.send(await BlogService.updatePost(request.user.id, request.params.id, request.body)); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.delete<{ Params: { id: string } }>('/blog/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Blog'],
            summary: 'Delete a blog post',
            description: 'Deletes a blog post. Only the original author can delete their post.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Blog post ID'),
            response: {
                200: { description: 'Post deleted', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    }, async (request, reply) => {
        try { return reply.send(await BlogService.deletePost(request.user.id, request.params.id)); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
