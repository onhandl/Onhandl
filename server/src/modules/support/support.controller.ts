import { FastifyInstance } from 'fastify';
import { SupportService } from './support.service';
import { cookieAuthSecurity, ticketSchema, standardErrorResponses } from '../../shared/docs';

export async function supportController(fastify: FastifyInstance) {
    fastify.post<{ Body: { subject: string; message: string } }>('/tickets', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Support'],
            summary: 'Submit a support ticket',
            description: 'Creates a new support ticket for the authenticated user.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                    subject: { type: 'string', minLength: 3, maxLength: 200 },
                    message: { type: 'string', minLength: 10 },
                },
            },
            response: {
                201: { description: 'Ticket created', ...ticketSchema },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.code(201).send(await SupportService.createTicket(request.user.id, request.body.subject, request.body.message));
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.get('/support', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Support'],
            summary: 'List my support tickets',
            description: 'Returns all support tickets submitted by the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'List of tickets', type: 'array', items: ticketSchema },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => SupportService.listTickets(request.user.id));
}
