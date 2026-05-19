import { FastifyInstance } from 'fastify';
import { SupportService } from './support.service';
import {
    cookieAuthSecurity,
    ticketSchema,
    standardErrorResponses,
} from '../../shared/docs';

/**
 * SupportController: User support ticketing and issue tracking.
 */
export async function supportController(fastify: FastifyInstance) {

    // POST /tickets - New submission
    fastify.post<{ Body: { subject: string; message: string } }>('/tickets', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Support'],
            summary: 'Submit a support ticket',
            description: 'Creates a new ticket to request assistance from the Onhandl team. High-priority tickets may receive telegram alerts if configured.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                    subject: { type: 'string', minLength: 3, maxLength: 200, description: 'Brief summary of the issue' },
                    message: { type: 'string', minLength: 10, description: 'Detailed explanation or steps to reproduce' },
                },
            },
            response: {
                201: {
                    description: 'Ticket successfully created',
                    ...ticketSchema,
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            return reply.code(201).send(await SupportService.createTicket(request.user.id, request.body.subject, request.body.message));
        } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    // GET /support - User history
    fastify.get('/support', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Support'],
            summary: 'List my support tickets',
            description: 'Returns all support tickets submitted by the authenticated user and their current resolution status.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'User ticket history',
                    type: 'array',
                    items: ticketSchema,
                },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request) => SupportService.listTickets(request.user.id));
}
