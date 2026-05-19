import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';
import {
    cookieAuthSecurity,
    idParamSchema,
    ticketSchema,
    standardErrorResponses,
} from '../../../shared/docs';

/**
 * SupportAdminHandlers: Helpdesk management and ticket resolution.
 */
export function registerSupportHandlers(fastify: FastifyInstance) {
    // GET /api/admin/support-tickets
    fastify.get('/support-tickets', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List all support tickets (Admin)',
            description: 'Returns a global list of all user support requests.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Global ticket queue', type: 'array', items: ticketSchema },
                ...standardErrorResponses([401, 403]),
            },
        },
    }, async () => AdminService.listSupportTickets());

    // PATCH /api/admin/support-tickets/:id
    fastify.patch<{ Params: { id: string }; Body: { status?: string; adminNotes?: string } }>(
        '/support-tickets/:id',
        {
            onRequest: [fastify.authorizeAdmin],
            schema: {
                tags: ['Admin'],
                summary: 'Resolve support ticket',
                description: 'Updates a ticket\'s status and internal resolution notes.',
                security: [cookieAuthSecurity],
                params: idParamSchema('Support Ticket ID'),
                body: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'closed'] },
                        adminNotes: { type: 'string', description: 'Internal response content' },
                    },
                },
                response: {
                    200: { description: 'Ticket successfully updated', ...ticketSchema },
                    ...standardErrorResponses([401, 403, 404, 500]),
                },
            },
        },
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
