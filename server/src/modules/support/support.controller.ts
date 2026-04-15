import { FastifyInstance } from 'fastify';
import { SupportService } from './support.service';

export async function supportController(fastify: FastifyInstance) {
    fastify.post<{ Body: { subject: string; message: string } }>(
        '/tickets', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const ticket = await SupportService.createTicket(request.user.id, request.body.subject, request.body.message);
                return reply.code(201).send(ticket);
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.get('/support', { onRequest: [fastify.authenticate] }, async (request) => {
        return SupportService.listTickets(request.user.id);
    });
}
