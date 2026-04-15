import { FastifyInstance } from 'fastify';
import { ToolService } from './tools.service';

export async function toolsController(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
        try {
            const result = await ToolService.listGrouped();
            return reply.send({ success: true, data: result });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch tools', error: error.message });
        }
    });
}
