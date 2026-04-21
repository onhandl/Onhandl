import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { Orchestrator } from '../../core/engine/orchestrator';
import {
    listAgents, getAgentWithGraph, getAgentCharacter, getPlanStatus, updateAgent, deleteAgent,
} from './agent.service';
import { AgentCreationService } from './services/agent-creation.service';
import { AgentRepository } from './agent.repository';
import {
    cookieAuthSecurity, idParamSchema, agentIdParamSchema, agentSchema, standardErrorResponses,
} from '../../shared/docs';

// ── READ ─────────────────────────────────────────────────────────────────────

export const readAgentRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get<{ Querystring: { isDraft?: string; status?: string; search?: string } }>(
        '/agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'List my agents',
            description: 'Returns all agents owned by the authenticated user, with optional filters.',
            security: [cookieAuthSecurity],
            querystring: {
                type: 'object',
                properties: {
                    isDraft: { type: 'string', enum: ['true', 'false'] },
                    status: { type: 'string' },
                    search: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Agent list', type: 'array', items: agentSchema },
                ...standardErrorResponses([401]),
            },
        },
    },
        async (request) => listAgents(request.user.id, request.query)
    );


    fastify.get('/agents/plan-status', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Get plan status',
            description: 'Returns the current user\'s plan capabilities, agent count, and limit.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'Plan status',
                    type: 'object',
                    properties: {
                        plan: { type: 'string' },
                        agentLimit: { type: 'number' },
                        agentCount: { type: 'number' },
                        canCreate: { type: 'boolean' },
                    },
                },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request, reply) => {
        try { return await getPlanStatus(request.user.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });


    fastify.get<{ Params: { id: string } }>('/agents/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Get agent by ID',
            description: 'Returns a single agent with its full graph definition. **Auth required**.',
            security: [cookieAuthSecurity],
            params: agentIdParamSchema(),
            response: {
                200: { description: 'Agent with graph', ...agentSchema },
                ...standardErrorResponses([401, 404]),
            },
        },
    }, async (request, reply) => {
        const result = await getAgentWithGraph(request.params.id);
        if (!result) return reply.code(404).send({ error: 'Agent not found' });
        return result;
    });

    fastify.get<{ Params: { id: string } }>('/agents/:id.json', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Get agent character data (JSON)',
            description: 'Returns simplified agent character data for embedded or external contexts. **Auth required**.',
            security: [cookieAuthSecurity],
            params: agentIdParamSchema(),
            response: {
                200: {
                    description: 'Agent character',
                    type: 'object',
                    properties: {
                        agentId: { type: 'string' },
                        name: { type: 'string' },
                        persona: { type: 'string' },
                        character: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([401, 404]),
            },
        },
    }, async (request, reply) => {
        const character = await getAgentCharacter(request.params.id);
        if (!character) return reply.code(404).send({ error: 'Agent not found' });
        return character;
    });
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createAgentRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { name: string; persona: string; agentType?: string; chains?: string[] } }>(
        '/agents/enhance', {
        schema: {
            tags: ['Agents'],
            summary: 'Preview enhanced persona',
            description: 'Uses AI to enhance a raw persona description without creating an agent. Auth is optional.',
            body: {
                type: 'object',
                required: ['name', 'persona'],
                properties: {
                    name: { type: 'string' },
                    persona: { type: 'string' },
                    agentType: { type: 'string', default: 'operational_agent' },
                    chains: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                200: {
                    description: 'Enhanced persona preview',
                    type: 'object',
                    properties: {
                        enhancedPersona: { type: 'string' },
                        suggestedChains: { type: 'array', items: { type: 'string' } },
                    }
                },
                ...standardErrorResponses([400, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const { name, persona, agentType = 'operational_agent', chains = [] } = request.body;
                if (!name || !persona) return reply.code(400).send({ error: 'Name and Persona are required' });
                return await AgentCreationService.previewEnhancePersona(name, persona, agentType, chains, request.user?.id);
            } catch (err: any) { return reply.code(500).send({ error: err.message }); }
        }
    );

    fastify.post<{ Body: { name: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; agentType?: string; chains?: string[] } }>(
        '/agents', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Create a new agent',
            description: 'Creates a new AI agent. **Plan restriction**: Agent count limits apply by plan.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    description: { type: 'string' },
                    persona: { type: 'string' },
                    graph: { type: 'object', additionalProperties: true },
                    identities: { type: 'object', additionalProperties: true },
                    character: { type: 'object', additionalProperties: true },
                    isDraft: { type: 'boolean', default: false },
                    agentType: { type: 'string', default: 'operational_agent' },
                    chains: { type: 'array', items: { type: 'string' } },
                },
            },
            response: {
                201: { description: 'Agent created', ...agentSchema },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const agent = await AgentCreationService.createAgent({ userId: request.user.id, ...request.body, log: (msg) => request.log.error(msg) });
                return reply.code(201).send(agent);
            } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message || 'Internal server error', details: err.details }); }
        }
    );

    fastify.post<{ Body: { templateId: string; name: string } }>(
        '/agents/from-template', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Create agent from template',
            description: 'Creates an agent pre-configured from a template. **Plan restrictions**: Agent count limits apply. Premium templates require Starter or above.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['templateId', 'name'],
                properties: {
                    templateId: { type: 'string' },
                    name: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Agent created from template', ...agentSchema },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await AgentCreationService.createAgentFromTemplate(request.user.id, request.body.templateId, request.body.name); }
            catch (err: any) { return reply.code(err.code || 500).send({ error: err.message || 'Failed to create agent from template' }); }
        }
    );
};

// ── UPDATE / DELETE / QUERY ───────────────────────────────────────────────────

export const updateAgentRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string; agentType?: string } }>(
        '/agents/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Update an agent',
            description: 'Updates an agent\'s configuration. **Plan restriction**: Free plan users cannot edit agents.',
            security: [cookieAuthSecurity],
            params: agentIdParamSchema(),
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    persona: { type: 'string' },
                    graph: { type: 'object', additionalProperties: true },
                    identities: { type: 'object', additionalProperties: true },
                    character: { type: 'object', additionalProperties: true },
                    isDraft: { type: 'boolean' },
                    agentType: { type: 'string' },
                },
            },
            response: {
                200: { description: 'Agent updated', ...agentSchema },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return await updateAgent({ id: request.params.id, userId: request.user.id, ...request.body, log: (msg) => request.log.error(msg) }); }
            catch (err: any) { return reply.code(err.code || 500).send({ error: err.message || 'Failed to update agent', details: err.details }); }
        }
    );

    fastify.delete<{ Params: { id: string } }>('/agents/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Delete an agent',
            description: 'Permanently deletes an agent and all associated data. **Plan restriction**: Free plan users cannot delete agents.',
            security: [cookieAuthSecurity],
            params: agentIdParamSchema(),
            response: {
                200: { description: 'Agent deleted', type: 'object', properties: { message: { type: 'string' } } },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            await deleteAgent(request.params.id, request.user.id);
            return { message: 'Agent and associated data deleted successfully' };
        } catch (err: any) { return reply.code(err.code || 500).send({ error: err.message || 'Failed to delete agent' }); }
    });

    fastify.post<{ Body: { prompt: string; agentId: string; sessionId: string } }>(
        '/agent/query', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Query agent (SSE chat)',
            description: 'Sends a natural language prompt to an agent and streams the response via SSE. Content-Type is `text/event-stream`.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['prompt', 'agentId', 'sessionId'],
                properties: {
                    prompt: { type: 'string' },
                    agentId: { type: 'string' },
                    sessionId: { type: 'string' },
                },
            },
            response: {
                200: { description: 'SSE stream of agent response events', type: 'string' },
                ...standardErrorResponses([401, 500]),
            },
        },
    },
        async (request, reply) => {
            const { prompt, agentId, sessionId } = request.body;
            const userId = request.user.id;
            try {
                const readable = new Readable({ read() { } });
                Orchestrator.handleQuery(prompt, agentId, userId, sessionId, readable)
                    .then(() => readable.push(null))
                    .catch((err) => { readable.push(`data: ${JSON.stringify({ error: err.message })}\n\n`); readable.push(null); });
                return reply
                    .header('Content-Type', 'text/event-stream').header('Cache-Control', 'no-cache')
                    .header('Connection', 'keep-alive')
                    .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                    .header('Access-Control-Allow-Credentials', 'true').send(readable);
            } catch (error: any) { return reply.code(500).send({ error: error.message }); }
        }
    );
};

// ── Module entry ──────────────────────────────────────────────────────────────

export const agentRoutes: FastifyPluginAsync = async (app) => {
    app.register(readAgentRoutes);
    app.register(createAgentRoutes);
    app.register(updateAgentRoutes);
};
