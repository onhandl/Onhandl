import { FastifyInstance } from 'fastify';
import { WorkspaceService } from './workspace.service';

export async function workspaceController(fastify: FastifyInstance) {
    fastify.get(
        '/workspaces', { onRequest: [fastify.authenticate] },
        async (request) => {
            return WorkspaceService.getForUser(request.user.id);
        }
    );

    fastify.post<{ Body: { name: string } }>(
        '/workspaces', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const workspace = await WorkspaceService.create(request.user.id, request.body.name);
                return reply.code(201).send(workspace);
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );
}
