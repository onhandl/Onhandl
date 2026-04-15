import { FastifyInstance } from 'fastify';
import { ToolRegistry } from '../../infrastructure/database/models/ToolRegistry';

export async function toolsController(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
        try {
            const tools = await ToolRegistry.find({ isActive: true }).sort({ network: 1, category: 1, name: 1 });
            const grouped: Record<string, any> = {};
            for (const tool of tools) {
                if (!grouped[tool.network]) grouped[tool.network] = {};
                if (!grouped[tool.network][tool.category]) grouped[tool.network][tool.category] = [];
                grouped[tool.network][tool.category].push({
                    name: tool.name,
                    description: tool.description,
                    schemaDef: tool.schemaDef,
                });
            }
            return reply.send({ success: true, data: { tools, grouped } });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch tools', error: error.message });
        }
    });
}
