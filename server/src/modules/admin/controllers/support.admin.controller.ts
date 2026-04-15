import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';

export function registerSupportHandlers(fastify: FastifyInstance) {
    // GET /api/admin/support-tickets
    fastify.get('/support-tickets', { onRequest: [fastify.authorizeAdmin] }, async () => {
        return AdminService.listSupportTickets();
    });

    // PATCH /api/admin/support-tickets/:id — update status + notes
    fastify.patch<{ Params: { id: string }; Body: { status?: string; adminNotes?: string } }>(
        '/support-tickets/:id',
        { onRequest: [fastify.authorizeAdmin] },
        async (request, reply) => {
            const { status, adminNotes } = request.body;
            try {
                return await AdminService.updateSupportTicket(request.params.id, status, adminNotes);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );
}
