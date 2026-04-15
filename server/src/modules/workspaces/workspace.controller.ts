import { FastifyInstance } from 'fastify';
import { WorkspaceService } from './workspace.service';
import { cookieAuthSecurity, workspaceSchema, standardErrorResponses } from '../../shared/docs';

export async function workspaceController(fastify: FastifyInstance) {
    fastify.get('/workspaces', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Workspaces'],
            summary: 'Get my workspaces',
            description: 'Returns all workspaces the authenticated user belongs to.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'List of workspaces', type: 'array', items: workspaceSchema },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => WorkspaceService.getForUser(request.user.id));

    fastify.post<{ Body: { name: string } }>('/workspaces', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Workspaces'],
            summary: 'Create a workspace',
            description: 'Creates a new workspace owned by the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', minLength: 1, maxLength: 100 } },
            },
            response: {
                201: { description: 'Workspace created', ...workspaceSchema },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspace = await WorkspaceService.create(request.user.id, request.body.name);
            return reply.code(201).send(workspace);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
