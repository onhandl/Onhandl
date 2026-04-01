import { FastifyPluginAsync } from 'fastify';
import { AgentDefinition } from '../../models/AgentDefinition';
import { AgentNode } from '../../models/AgentNode';
import { AgentEdge } from '../../models/AgentEdge';
import { AgentEnhancer } from '../../services/AgentEnhancer';
import { validateCharacter } from '../../characters/validator';
import { Orchestrator } from '../../engine/orchestrator';
import { Readable } from 'stream';

async function syncGraph(agentId: string, graph: any) {
    if (graph.nodes) {
        await AgentNode.deleteMany({ agentId });
        await AgentNode.insertMany(graph.nodes.map((n: any) => ({
            agentId, nodeId: n.id, type: n.type, position: n.position,
            chain: n.data?.chain, tool: n.data?.tool, params: n.data?.params, data: n.data
        })));
    }
    if (graph.edges) {
        await AgentEdge.deleteMany({ agentId });
        await AgentEdge.insertMany(graph.edges.map((e: any) => ({
            agentId, edgeId: e.id, source: e.source, target: e.target,
            sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, data: e.data
        })));
    }
}

export const updateAgentRoutes: FastifyPluginAsync = async (fastify) => {

    // Update an agent (handles auto-save and persona re-enhancement)
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string; agentType?: string } }>(
        '/agents/:id',
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { name, description, persona, graph, identities, character, isDraft, provider, apiKey, model, agentType } = request.body;

                const agent = await AgentDefinition.findById(id);
                if (!agent) return reply.code(404).send({ error: 'Agent not found' });

                const currentAgentType = agentType || agent.character?.agent_type || 'operational_agent';

                if (name) agent.name = name;
                if (description !== undefined) agent.description = description;
                if (identities) agent.identities = identities;
                if (isDraft !== undefined) agent.isDraft = isDraft;
                if (provider) agent.modelProvider = provider as any;
                else if (!agent.modelProvider) agent.modelProvider = 'ollama';
                if (model) agent.modelConfig.modelName = model;

                let intermediateCharacter = character ? { ...agent.character, ...character } : agent.character || {};

                if (persona && persona !== agent.persona && (!intermediateCharacter.character?.bio || Object.keys(intermediateCharacter).length <= 1)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name || agent.name, persona, provider || agent.modelProvider, apiKey, model || agent.modelConfig.modelName, currentAgentType);
                        if (!enhanced.character || !enhanced.identity) throw new Error('AI generated an incomplete character.');
                        intermediateCharacter = enhanced;
                        agent.persona = persona;
                        if (!description) agent.description = enhanced.identity?.description || enhanced.character?.bio;
                    } catch (error: any) {
                        request.log.error('Persona re-enhancement failed: ' + error);
                        return reply.code(400).send({ error: 'Persona expansion failed', details: error.message });
                    }
                }

                if (character !== undefined && Object.keys(intermediateCharacter).length > 0) {
                    const validationResult = validateCharacter(currentAgentType, intermediateCharacter);
                    if (!validationResult.isValid) return reply.code(400).send({ error: 'Character Schema Validation Failed', details: validationResult.errors });
                    agent.character = intermediateCharacter;
                } else if (Object.keys(intermediateCharacter).length > 0) {
                    agent.character = intermediateCharacter;
                }

                if (agentType) agent.agentType = agentType as any;
                await agent.save();

                if (graph) await syncGraph(id, graph);

                return agent;
            } catch (err) {
                console.error('Update failed:', err);
                return reply.code(500).send({ error: 'Failed to update agent' });
            }
        }
    );

    // Delete an agent and its graph data
    fastify.delete<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const agent = await AgentDefinition.findByIdAndDelete(id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });
            await Promise.all([AgentNode.deleteMany({ agentId: id }), AgentEdge.deleteMany({ agentId: id })]);
            return { message: 'Agent and associated data deleted successfully' };
        } catch (err) {
            console.error('Delete failed:', err);
            return reply.code(500).send({ error: 'Failed to delete agent' });
        }
    });

    // Unified agent query (SSE stream)
    fastify.post<{ Body: { prompt: string; agentId: string; sessionId: string } }>(
        '/agent/query',
        async (request, reply) => {
            const { prompt, agentId, sessionId } = request.body;
            const userId = (request as any).user?.id || '60c72b2f9b1d8e1f4c8b4567';
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
