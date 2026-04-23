import { FastifyPluginAsync } from 'fastify';
import {
    CreateFinancialAgentStructuredInput,
    DraftFinancialAgentPromptInput,
    FinancialAgentService,
} from '../financial-agent.service';
import {
    cookieAuthSecurity,
    standardErrorResponses,
    workspaceHeaderSchema,
} from '../../../shared/docs';
import {
    FINANCIAL_AGENT_PRESETS,
    draftFinancialAgentInputSchema,
} from '../financial-agent-validation.service';

export const financialAgentController: FastifyPluginAsync = async (fastify) => {
    fastify.post<{
        Body: Omit<DraftFinancialAgentPromptInput, 'workspaceId'>
    }>('/financial-agents/draft', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Draft financial agent from prompt',
            description: 'Creates a validated draft configuration from natural language without persisting agent records.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            body: {
                type: 'object',
                required: ['mode', 'prompt'],
                properties: {
                    mode: { type: 'string', const: 'prompt' },
                    prompt: { type: 'string', minLength: 1 },
                    preset: { type: 'string', enum: FINANCIAL_AGENT_PRESETS },
                    knownRecipients: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['label', 'address', 'chain'],
                            properties: {
                                label: { type: 'string', minLength: 1 },
                                address: { type: 'string', minLength: 1 },
                                chain: { type: 'string', minLength: 1 },
                            },
                        },
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    additionalProperties: true,
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });

            const body = request.body;
            const draft = await FinancialAgentService.draftFromPrompt({
                mode: 'prompt',
                workspaceId,
                prompt: body.prompt,
                preset: body.preset,
                knownRecipients: body.knownRecipients,
            });

            return reply.code(200).send(draft);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message || 'Failed to draft financial agent' });
        }
    });

    fastify.post<{
        Body: Omit<CreateFinancialAgentStructuredInput, 'workspaceId'>
    }>('/financial-agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Create financial agent from structured draft',
            description: 'Creates financial agents from an already-validated structured runtime draft.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            body: {
                type: 'object',
                required: ['mode', 'draft'],
                properties: {
                    mode: { type: 'string', const: 'structured' },
                    draft: {
                        type: 'object',
                        additionalProperties: true,
                    },
                },
            },
            response: {
                201: {
                    type: 'object',
                    additionalProperties: true,
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });

            const body = request.body;
            const parsedDraft = draftFinancialAgentInputSchema.safeParse(body.draft);
            if (!parsedDraft.success) {
                return reply.code(400).send({
                    error: parsedDraft.error.issues[0]?.message || 'Invalid draft payload',
                });
            }

            const result = await FinancialAgentService.createFromStructured({
                mode: 'structured',
                workspaceId,
                draft: parsedDraft.data,
            });

            return reply.code(201).send(result);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message || 'Failed to create financial agent' });
        }
    });

    fastify.get('/financial-agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'List financial agents',
            description: 'Lists runtime financial agents for workspace context.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            response: {
                200: {
                    type: 'array',
                    items: { type: 'object', additionalProperties: true },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        return FinancialAgentService.listAgents(workspaceId);
    });

    fastify.get<{ Params: { id: string } }>('/financial-agents/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Get financial agent',
            description: 'Returns financial runtime agent detail with current state.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'string' } },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        const agent = await FinancialAgentService.getAgent(workspaceId, request.params.id);
        if (!agent) return reply.code(404).send({ error: 'Financial agent not found' });
        return agent;
    });

    fastify.post<{ Params: { id: string } }>('/financial-agents/:id/pause', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Pause financial agent',
            description: 'Pauses event processing for a financial agent.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'string' } },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        const updated = await FinancialAgentService.pauseAgent(workspaceId, request.params.id);
        if (!updated) return reply.code(404).send({ error: 'Financial agent not found' });
        return updated;
    });

    fastify.post<{ Params: { id: string } }>('/financial-agents/:id/activate', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Activate financial agent',
            description: 'Activates event processing for a financial agent.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'string' } },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        const updated = await FinancialAgentService.activateAgent(workspaceId, request.params.id);
        if (!updated) return reply.code(404).send({ error: 'Financial agent not found' });
        return updated;
    });
};
