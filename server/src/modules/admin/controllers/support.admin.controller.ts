import { FastifyInstance } from 'fastify';
import { SupportTicket } from '../../../infrastructure/database/models/SupportTicket';
import { requireAdmin } from '../admin.middleware';

export function registerSupportHandlers(fastify: FastifyInstance) {
    // GET /api/admin/support-tickets
    fastify.get('/support-tickets', async (request, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const tickets = await SupportTicket.find()
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(tickets);
    });

    // PATCH /api/admin/support-tickets/:id — update status + notes
    fastify.patch('/support-tickets/:id', async (request: any, reply) => {
        const auth = await requireAdmin(request, reply, fastify);
        if (!auth) return;

        const { status, adminNotes } = request.body as any;
        const ticket = await SupportTicket.findByIdAndUpdate(
            request.params.id,
            { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
            { new: true }
        );
        if (!ticket) return reply.code(404).send({ error: 'Ticket not found' });
        return reply.send(ticket);
    });
}
