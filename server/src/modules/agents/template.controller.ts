import { FastifyInstance } from 'fastify';
import { AgentTemplateService } from './agent-template.service';
import { idParamSchema, standardErrorResponses } from '../../shared/docs';

export async function templatesController(fastify: FastifyInstance) {
    fastify.get('/', {
        schema: {
            tags: ['Agents'],
            summary: 'List agent templates',
            description: 'Returns all available agent templates. Basic templates are available on all plans; premium templates require Starter or above.',
            response: {
                200: {
                    description: 'Template list',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            tier: { type: 'string', enum: ['basic', 'premium'] },
                        },
                    },
                },
                ...standardErrorResponses([500]),
            },
        },
    }, async (_request, reply) => {
        try { return AgentTemplateService.listTemplates(); }
        catch (err) { return reply.code(500).send({ error: 'Failed to fetch templates' }); }
    });

    fastify.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Agents'],
            summary: 'Get template by ID',
            description: 'Returns a single agent template definition including the graph structure.',
            params: idParamSchema('Template ID'),
            response: {
                200: { description: 'Template definition', type: 'object', additionalProperties: true },
                ...standardErrorResponses([404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const template = AgentTemplateService.getTemplateById(request.params.id);
            if (!template) return reply.code(404).send({ error: 'Template not found' });
            return template;
        } catch (err) { return reply.code(500).send({ error: 'Failed to fetch template' }); }
    });
}
