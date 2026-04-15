import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { Orchestrator } from '../../core/engine/orchestrator';
import {
    listAgents, getAgentWithGraph, getPlanStatus, updateAgent, deleteAgent,
} from './agent.service';
import { AgentCreationService } from './services/agent-creation.service';
import { AgentAnalyticsService } from './services/agent-analytics.service';
import { AgentRepository } from './agent.repository';

// ── READ ─────────────────────────────────────────────────────────────────────

export const readAgentRoutes: FastifyPluginAsync = async (fastify) => {

    fastify.get<{ Querystring: { isDraft?: string; status?: string; search?: string } }>(
        '/agents',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            return listAgents(request.user.id, request.query);
        }
    );

    fastify.get(
        '/agents/revenue',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            return AgentAnalyticsService.getRevenueDashboard(request.user.id);
        }
    );

    fastify.get(
        '/agents/plan-status',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return await getPlanStatus(request.user.id); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.get<{ Params: { id: string } }>(
        '/agents/:id/stats',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return await AgentAnalyticsService.getAgentStats(request.params.id, request.user.id); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        const result = await getAgentWithGraph(request.params.id);
        if (!result) return reply.code(404).send({ error: 'Agent not found' });
        return result;
    });

    fastify.get<{ Params: { id: string } }>('/agents/:id.json', async (request, reply) => {
        const agent = await AgentRepository.findById(request.params.id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        return { agentId: agent._id, name: agent.name, persona: agent.persona, character: agent.character || {} };
    });
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createAgentRoutes: FastifyPluginAsync = async (fastify) => {

    // enhance is optional-auth: tries to use the authenticated user if available
    fastify.post<{ Body: { name: string; persona: string; agentType?: string; chains?: string[] } }>(
        '/agents/enhance',
        async (request, reply) => {
            try {
                const { name, persona, agentType = 'operational_agent', chains = [] } = request.body;
                if (!name || !persona) return reply.code(400).send({ error: 'Name and Persona are required' });
                return await AgentCreationService.previewEnhancePersona(name, persona, agentType, chains, request.user?.id);
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }
        }
    );

    fastify.post<{ Body: { name: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; agentType?: string; chains?: string[] } }>(
        '/agents',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const agent = await AgentCreationService.createAgent({ userId: request.user.id, ...request.body, log: (msg) => request.log.error(msg) });
                return reply.code(201).send(agent);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message || 'Internal server error', details: err.details });
            }
        }
    );

    fastify.post<{ Body: { templateId: string; name: string } }>(
        '/agents/from-template',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await AgentCreationService.createAgentFromTemplate(request.user.id, request.body.templateId, request.body.name);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message || 'Failed to create agent from template' });
            }
        }
    );
};

// ── UPDATE / DELETE / QUERY ───────────────────────────────────────────────────

export const updateAgentRoutes: FastifyPluginAsync = async (fastify) => {

    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string; agentType?: string } }>(
        '/agents/:id',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                return await updateAgent({ id: request.params.id, userId: request.user.id, ...request.body, log: (msg) => request.log.error(msg) });
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message || 'Failed to update agent', details: err.details });
            }
        }
    );

    fastify.delete<{ Params: { id: string } }>('/agents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            await deleteAgent(request.params.id, request.user.id);
            return { message: 'Agent and associated data deleted successfully' };
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message || 'Failed to delete agent' });
        }
    });

    fastify.post<{ Body: { prompt: string; agentId: string; sessionId: string } }>(
        '/agent/query',
        async (request, reply) => {
            const { prompt, agentId, sessionId } = request.body;
            const userId = request.user?.id || '60c72b2f9b1d8e1f4c8b4567';
            try {
                const readable = new Readable({ read() { } });
                Orchestrator.handleQuery(prompt, agentId, userId, sessionId, readable)
                    .then(() => readable.push(null))
                    .catch((err) => { readable.push(`data: ${JSON.stringify({ error: err.message })}\n\n`); readable.push(null); });
                return reply
                    .header('Content-Type', 'text/event-stream')
                    .header('Cache-Control', 'no-cache')
                    .header('Connection', 'keep-alive')
                    .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                    .header('Access-Control-Allow-Credentials', 'true')
                    .send(readable);
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        }
    );
};

// ── Module entry ──────────────────────────────────────────────────────────────

export const agentRoutes: FastifyPluginAsync = async (app) => {
    app.register(readAgentRoutes);
    app.register(createAgentRoutes);
    app.register(updateAgentRoutes);
};
