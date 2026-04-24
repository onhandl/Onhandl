import { FastifyPluginAsync } from 'fastify';
import {
    CreateFinancialAgentStructuredInput,
    DraftFinancialAgentPromptInput,
    FinancialAgentService,
} from '../financial-services.ts/financial-agent.service';
import {
    cookieAuthSecurity,
    standardErrorResponses,
    workspaceHeaderSchema,
} from '../../../shared/docs';
import {
    FINANCIAL_AGENT_PRESETS,
    FINANCIAL_DRAFT_EVENT_TYPES,
    FINANCIAL_DRAFT_ACTION_TYPES,
    SUPPORTED_NETWORKS,
    RECIPIENT_POLICIES,
} from '../financial-services.ts/financial-agent-validation.service';

export const financialAgentController: FastifyPluginAsync = async (fastify) => {
    fastify.post<{
        Body: Omit<DraftFinancialAgentPromptInput, 'workspaceId'>;
    }>('/financial-agents/draft', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Draft financial agent from rough prompt',
            description:
                'Accepts a user rough idea in natural language and returns a drafted structured financial-agent configuration without persisting anything.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            body: {
                type: 'object',
                required: ['mode', 'prompt', 'name'],
                additionalProperties: false,
                properties: {
                    mode: { type: 'string', const: 'prompt' },
                    name: { type: 'string', minLength: 1, 
                        description: 'Name of the financial agent' },
                    prompt: {
                        type: 'string',
                        minLength: 1,
                        description:
                            'A rough natural-language description of what the user wants the financial agent to do.',
                    },
                    preset: {
                        type: 'string',
                        enum: FINANCIAL_AGENT_PRESETS,
                        description: 'Optional drafting preset used to bias the generated configuration.',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    description:
                        'A drafted structured agent configuration derived from the user prompt. This is a draft only and is not persisted.',
                    additionalProperties: true,
                    properties: {
                        agent: {
                            type: 'object',
                            additionalProperties: true,
                        },
                        policies: {
                            type: 'array',
                            items: {
                                type: 'object',
                                additionalProperties: true,
                            },
                        },
                        assumptions: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) {
                return reply.code(400).send({ error: 'Missing x-workspace-id header' });
            }

            const body = request.body;

            const draft = await FinancialAgentService.draftFromPrompt({
                mode: 'prompt',
                workspaceId,
                name: body.name,
                prompt: body.prompt,
                preset: body.preset,
            });

            return reply.code(200).send(draft);
        } catch (err: any) {
            return reply.code(err.code || 500).send({
                error: err.message || 'Failed to draft financial agent',
            });
        }
    });

    fastify.post<{
        Body: Omit<CreateFinancialAgentStructuredInput, 'workspaceId'>;
    }>('/financial-agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Create financial agent from structured draft',
            description:
                'Creates and persists a financial agent from a real structured draft configuration. This route is not for rough prompts.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            body: {
                type: 'object',
                required: ['mode', 'draft'],
                additionalProperties: false,
                properties: {
                    mode: { type: 'string', const: 'structured' },
                    draft: {
                        type: 'object',
                        required: ['agent', 'policies'],
                        additionalProperties: false,
                        properties: {
                            agent: {
                                type: 'object',
                                required: [
                                    'name',
                                    'description',
                                    'subscribedEvents',
                                    'permissionConfig',
                                    'approvalConfig',
                                    'networkConfigs',
                                ],
                                additionalProperties: false,
                                properties: {
                                    name: { type: 'string', minLength: 1 },
                                    description: { type: 'string', minLength: 1 },
                                    subscribedEvents: {
                                        type: 'array',
                                        minItems: 1,
                                        items: {
                                            type: 'string',
                                            enum: FINANCIAL_DRAFT_EVENT_TYPES,
                                        },
                                    },
                                    permissionConfig: {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            allowedChains: {
                                                type: 'array',
                                                items: { type: 'string', enum: SUPPORTED_NETWORKS },
                                            },
                                            blockedChains: {
                                                type: 'array',
                                                items: { type: 'string', enum: SUPPORTED_NETWORKS },
                                            },
                                            allowedActions: {
                                                type: 'array',
                                                items: { type: 'string', enum: FINANCIAL_DRAFT_ACTION_TYPES },
                                            },
                                            blockedActions: {
                                                type: 'array',
                                                items: { type: 'string', enum: FINANCIAL_DRAFT_ACTION_TYPES },
                                            },
                                        },
                                    },
                                    approvalConfig: {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            fallbackRequireApprovalForNewRecipients: { type: 'boolean' },
                                            fallbackRequireApprovalForInvestments: { type: 'boolean' },
                                            fallbackRequireApprovalForSwaps: { type: 'boolean' },
                                        },
                                    },
                                    networkConfigs: {
                                        type: 'array',
                                        minItems: 1,
                                        items: {
                                            type: 'object',
                                            required: ['network', 'recipientPolicy'],
                                            additionalProperties: false,
                                            properties: {
                                                network: { type: 'string', enum: SUPPORTED_NETWORKS },
                                                enabled: { type: 'boolean' },
                                                allowedAssets: {
                                                    type: 'array',
                                                    items: { type: 'string', minLength: 1 },
                                                },
                                                blockedAssets: {
                                                    type: 'array',
                                                    items: { type: 'string', minLength: 1 },
                                                },
                                                allowedActions: {
                                                    type: 'array',
                                                    items: { type: 'string', enum: FINANCIAL_DRAFT_ACTION_TYPES },
                                                },
                                                blockedActions: {
                                                    type: 'array',
                                                    items: { type: 'string', enum: FINANCIAL_DRAFT_ACTION_TYPES },
                                                },
                                                recipientPolicy: {
                                                    type: 'string',
                                                    enum: RECIPIENT_POLICIES,
                                                },
                                                allowedRecipients: {
                                                    type: 'array',
                                                    items: { type: 'string', minLength: 1 },
                                                },
                                                blockedRecipients: {
                                                    type: 'array',
                                                    items: { type: 'string', minLength: 1 },
                                                },
                                                assetLimits: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        required: ['asset'],
                                                        additionalProperties: false,
                                                        properties: {
                                                            asset: { type: 'string', minLength: 1 },
                                                            maxSpendPerTx: { type: 'string', minLength: 1 },
                                                            maxSpendPerDay: { type: 'string', minLength: 1 },
                                                            maxSpendPerWeek: { type: 'string', minLength: 1 },
                                                            maxSpendPerMonth: { type: 'string', minLength: 1 },
                                                            requireApprovalAbove: { type: 'string', minLength: 1 },
                                                            requireApprovalForNewRecipients: { type: 'boolean' },
                                                            requireApprovalForInvestments: { type: 'boolean' },
                                                            requireApprovalForSwaps: { type: 'boolean' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            policies: {
                                type: 'array',
                                minItems: 1,
                                items: {
                                    type: 'object',
                                    required: ['trigger', 'conditions', 'actions'],
                                    additionalProperties: false,
                                    properties: {
                                        trigger: {
                                            type: 'string',
                                            enum: FINANCIAL_DRAFT_EVENT_TYPES,
                                        },
                                        conditions: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                required: ['field', 'op', 'value'],
                                                additionalProperties: false,
                                                properties: {
                                                    field: { type: 'string', minLength: 1 },
                                                    op: {
                                                        type: 'string',
                                                        enum: ['eq', 'gt', 'gte', 'lt', 'lte', 'in'],
                                                    },
                                                    value: {},
                                                },
                                            },
                                        },
                                        actions: {
                                            type: 'array',
                                            minItems: 1,
                                            items: {
                                                type: 'object',
                                                additionalProperties: true,
                                            },
                                        },
                                        priority: {
                                            type: 'integer',
                                            minimum: 1,
                                        },
                                    },
                                },
                            },
                            assumptions: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                        },
                    },
                },
            },
            response: {
                201: {
                    type: 'object',
                    description:
                        'The persisted financial agent, its initial state, created policies, and any assumptions carried from the draft.',
                    additionalProperties: true,
                    properties: {
                        agent: { type: 'object', additionalProperties: true },
                        state: { type: 'object', additionalProperties: true },
                        policies: {
                            type: 'array',
                            items: { type: 'object', additionalProperties: true },
                        },
                        assumptions: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                },
                ...standardErrorResponses([400, 401, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) {
                return reply.code(400).send({ error: 'Missing x-workspace-id header' });
            }

            const body = request.body;

            const result = await FinancialAgentService.createFromStructured({
                mode: 'structured',
                workspaceId,
                draft: body.draft,
            });

            return reply.code(201).send(result);
        } catch (err: any) {
            return reply.code(err.code || 500).send({
                error: err.message || 'Failed to create financial agent',
            });
        }
    });

    fastify.get('/financial-agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'List financial agents',
            description: 'Lists persisted financial agents for the current workspace.',
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
        if (!workspaceId) {
            return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        }

        return FinancialAgentService.listAgents(workspaceId);
    });

    fastify.get<{ Params: { id: string } }>('/financial-agents/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Get financial agent',
            description: 'Returns financial agent details together with current runtime state.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) {
            return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        }

        const agent = await FinancialAgentService.getAgent(workspaceId, request.params.id);
        if (!agent) {
            return reply.code(404).send({ error: 'Financial agent not found' });
        }

        return agent;
    });

    fastify.post<{ Params: { id: string } }>('/financial-agents/:id/pause', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Pause financial agent',
            description: 'Pauses runtime event processing for the financial agent.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) {
            return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        }

        const updated = await FinancialAgentService.pauseAgent(workspaceId, request.params.id);
        if (!updated) {
            return reply.code(404).send({ error: 'Financial agent not found' });
        }

        return updated;
    });

    fastify.post<{ Params: { id: string } }>('/financial-agents/:id/activate', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Financial Agents'],
            summary: 'Activate financial agent',
            description: 'Activates runtime event processing for the financial agent.',
            security: [cookieAuthSecurity],
            headers: workspaceHeaderSchema,
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([400, 401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) {
            return reply.code(400).send({ error: 'Missing x-workspace-id header' });
        }

        const updated = await FinancialAgentService.activateAgent(workspaceId, request.params.id);
        if (!updated) {
            return reply.code(404).send({ error: 'Financial agent not found' });
        }

        return updated;
    });
};