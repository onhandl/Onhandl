import { FastifyInstance } from 'fastify';
import { Workspace } from '../../infrastructure/database/models/Workspace';

export async function workspaceController(fastify: FastifyInstance) {
    fastify.get('/workspaces', async (_request, _reply) => {
        return Workspace.find({}).populate('ownerId');
    });

    fastify.post<{ Body: { name: string; ownerId: string } }>(
        '/workspaces',
        async (request, reply) => {
            const { name, ownerId } = request.body;
            const workspace = new Workspace({ name, ownerId });
            await workspace.save();
            return reply.code(201).send(workspace);
        }
    );
}
