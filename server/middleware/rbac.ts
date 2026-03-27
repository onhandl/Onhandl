import { FastifyRequest, FastifyReply } from 'fastify';
import { Workspace } from '../models/Workspace';

export type Role = 'admin' | 'editor' | 'viewer';

export const requireRole = (requiredRole: Role) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (request as any).user;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            // Simple workspace-level RBAC
            const workspace = await Workspace.findOne({ members: user.id });
            if (!workspace) {
                return reply.code(403).send({ error: 'No workspace access' });
            }

            const isOwner = workspace.ownerId.toString() === user.id;
            const currentRole: Role = isOwner ? 'admin' : 'viewer';

            const roleHierarchy: Record<Role, number> = {
                'admin': 3,
                'editor': 2,
                'viewer': 1
            };

            if (roleHierarchy[currentRole] < roleHierarchy[requiredRole]) {
                return reply.code(403).send({ error: 'Insufficient permissions' });
            }
        } catch (err) {
            return reply.code(500).send({ error: 'RBAC Check Failed' });
        }
    };
};
