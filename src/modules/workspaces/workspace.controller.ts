import { FastifyInstance } from 'fastify';
import { WorkspaceService } from './workspace.service';
import {
    cookieAuthSecurity,
    workspaceSchema,
    standardErrorResponses,
} from '../../shared/docs';

/**
 * WorkspaceController: Management of collaborative environments and agent grouping.
 */
export async function workspaceController(fastify: FastifyInstance) {

    // GET /workspaces - List user context
    fastify.get('/workspaces', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Workspaces'],
            summary: 'Get my workspaces',
            description: 'Returns all workspaces where the current user is an owner or member.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'List of workspaces',
                    type: 'array',
                    items: workspaceSchema,
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => WorkspaceService.getForUser(request.user.id));

    // POST /workspaces - Create new container
    fastify.post<{ Body: { name: string } }>('/workspaces', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Workspaces'],
            summary: 'Create a workspace',
            description: 'Initializes a new workspace. The creating user becomes the owner.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100, description: 'Display name for the workspace' },
                },
            },
            response: {
                201: {
                    description: 'Workspace successfully created',
                    ...workspaceSchema,
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspace = await WorkspaceService.create(request.user.id, request.body.name);
            return reply.code(201).send(workspace);
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });
}
