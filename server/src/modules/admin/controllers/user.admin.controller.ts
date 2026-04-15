import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';

export function registerUserHandlers(fastify: FastifyInstance) {
    // GET /api/admin/users
    fastify.get('/users', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listUsers();
    });

    // DELETE /api/admin/users/:id
    fastify.delete<{ Params: { id: string } }>('/users/:id', { onRequest: [fastify.authorizeAdmin] }, async (request, reply) => {
        try {
            return await AdminService.deleteUser(request.params.id);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // PATCH /api/admin/users/:id/admin — toggle admin flag
    fastify.patch<{ Params: { id: string }; Body: { isAdmin: boolean } }>(
        '/users/:id/admin',
        { onRequest: [fastify.authorizeAdmin] },
        async (request, reply) => {
            try {
                return await AdminService.toggleUserAdmin(request.params.id, request.body.isAdmin);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );
}
