import { FastifyInstance } from 'fastify';
import { User } from '../../../infrastructure/database/models/User';
import { requireAdmin } from '../admin.middleware';

export function registerUserHandlers(fastify: FastifyInstance) {
    // GET /api/admin/users
    fastify.get('/users', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(users);
    });

    // DELETE /api/admin/users/:id
    fastify.delete('/users/:id', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const user = await User.findByIdAndDelete(request.params.id);
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send({ success: true });
    });

    // PATCH /api/admin/users/:id/admin — toggle admin flag
    fastify.patch('/users/:id/admin', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const { isAdmin } = request.body as { isAdmin: boolean };
        const user = await User.findByIdAndUpdate(
            request.params.id,
            { isAdmin },
            { new: true }
        ).select('-password');
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send(user);
    });
}
