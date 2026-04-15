import { FastifyInstance } from 'fastify';
import { ToolService } from './tools.service';
import { standardErrorResponses } from '../../shared/docs';

export async function toolsController(fastify: FastifyInstance) {
    fastify.get('/', {
        schema: {
            tags: ['Tools'],
            summary: 'List available node tools',
            description: 'Returns all available node tools grouped by category. These are the building blocks available when constructing agent graphs.',
            response: {
                200: {
                    description: 'Grouped tool definitions',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([500]),
            },
        },
    }, async (request, reply) => {
        try { return reply.send({ success: true, data: await ToolService.listGrouped() }); }
        catch (error: any) { return reply.status(500).send({ success: false, message: 'Failed to fetch tools', error: error.message }); }
    });
}
