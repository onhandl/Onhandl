import { FastifyPluginAsync } from 'fastify';
import { AgentDefinition } from '../models/AgentDefinition';
import { AgentNode } from '../models/AgentNode';
import { AgentEdge } from '../models/AgentEdge';
import { Workspace } from '../models/Workspace';
import { AgentEnhancer } from '../services/AgentEnhancer';

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
    // Get all agents for the authenticated user's workspace
    fastify.get<{ Querystring: { isDraft?: string } }>('/agents', async (request, reply) => {
        try {
            const token = request.cookies['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });

            const decoded = fastify.jwt.verify(token) as any;
            const { isDraft } = request.query;

            // Find user's workspace
            let workspace = await Workspace.findOne({ ownerId: decoded.id });
            if (!workspace) {
                workspace = new Workspace({
                    name: `Default Workspace`,
                    ownerId: decoded.id,
                    members: [decoded.id]
                });
                await workspace.save();
            }

            const filter: any = { workspaceId: workspace._id };
            if (isDraft !== undefined) {
                filter.isDraft = isDraft === 'true';
            }

            const agents = await AgentDefinition.find(filter).sort({ updatedAt: -1 });
            return agents;
        } catch (err) {
            return reply.code(401).send({ error: 'Invalid token' });
        }
    });

    // Get a specific agent with its reconstructed graph
    fastify.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const agent = await AgentDefinition.findById(id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });

            const nodes = await AgentNode.find({ agentId: id });
            const edges = await AgentEdge.find({ agentId: id });

            // Reconstruct the graph format for compatibility with the frontend
            return {
                ...agent.toObject(),
                graph: {
                    nodes: nodes.map(n => ({
                        id: n.nodeId,
                        type: n.type,
                        position: n.position,
                        data: {
                            ...n.data,
                            chain: n.chain,
                            tool: n.tool,
                            params: n.params
                        }
                    })),
                    edges: edges.map(e => ({
                        id: e.edgeId,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle,
                        label: e.label,
                        data: e.data
                    }))
                }
            };
        } catch (err) {
            return reply.code(500).send({ error: 'Failed to fetch agent' });
        }
    });

    // Public endpoint for transparency: View Agent Enhanced Character JSON
    fastify.get<{ Params: { id: string } }>('/agents/:id.json', async (request, reply) => {
        try {
            const { id } = request.params;
            const agent = await AgentDefinition.findById(id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });

            return {
                agentId: agent._id,
                name: agent.name,
                persona: agent.persona,
                character: agent.character || {}
            };
        } catch (err) {
            return reply.code(500).send({ error: 'Failed to fetch agent JSON' });
        }
    });

    // Preview AI Persona Enhancement
    fastify.post<{ Body: { name: string; persona: string; provider?: string; apiKey?: string; model?: string } }>(
        '/agents/enhance',
        async (request, reply) => {
            try {
                const { name, persona, provider, apiKey, model } = request.body;
                if (!name || !persona) return reply.code(400).send({ error: 'Name and Persona are required' });

                const enhanced = await AgentEnhancer.enhancePersona(name, persona, provider, apiKey, model);
                return enhanced;
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }
        }
    );

    // Create a new agent
    fastify.post<{ Body: { name: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string } }>(
        '/agents',
        async (request, reply) => {
            try {
                const token = request.cookies['auth_token'];
                if (!token) return reply.code(401).send({ error: 'Unauthorized' });

                const decoded = fastify.jwt.verify(token) as any;
                const { name, description, persona, graph, identities, character, isDraft, provider, apiKey, model } = request.body;

                const workspace = await Workspace.findOne({ ownerId: decoded.id });
                if (!workspace) return reply.code(404).send({ error: 'No workspace found' });

                let finalCharacter = character || {};

                // If persona is provided, use AI to enhance the character bio/traits (skip if already provided/reviewed)
                if (persona && (!finalCharacter.bio || !finalCharacter.instructions)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name, persona, provider, apiKey, model);
                        if (!enhanced.bio || !enhanced.instructions) {
                            throw new Error('AI generated an incomplete character. Please try a more detailed persona summary.');
                        }
                        finalCharacter = {
                            ...finalCharacter,
                            ...enhanced
                        };
                        request.log.info(`[AgentStudio] Successfully generated AI character for: ${name}`);
                    } catch (error: any) {
                        request.log.error('Persona enhancement failed: ' + error);
                        return reply.code(400).send({
                            error: 'Persona expansion failed',
                            details: error.message || 'The AI was unable to generate a valid character from your persona summary.'
                        });
                    }
                }

                const agent = new AgentDefinition({
                    ownerId: decoded.id,
                    workspaceId: workspace._id,
                    name,
                    persona,
                    description: description || (finalCharacter as any).description || (finalCharacter.bio ? finalCharacter.bio : ''),
                    identities: identities || {},
                    character: finalCharacter,
                    modelProvider: provider || 'ollama',
                    modelConfig: {
                        modelName: model || 'qwen2.5:3b'
                    },
                    isDraft: isDraft ?? true
                });

                await agent.save();

                // Save nodes and edges if provided, or inject a default Character node
                if (graph?.nodes && graph.nodes.length > 0) {
                    await AgentNode.insertMany(graph.nodes.map((n: any) => ({
                        agentId: agent._id,
                        nodeId: n.id,
                        type: n.type,
                        position: n.position,
                        chain: n.data?.chain,
                        tool: n.data?.tool,
                        params: n.data?.params,
                        data: n.data
                    })));
                } else {
                    // Inject default Character node as requested by user
                    await AgentNode.create({
                        agentId: agent._id,
                        nodeId: `character-${Date.now()}`,
                        type: 'input', // Represent character as an input/starting node
                        position: { x: 100, y: 100 },
                        data: {
                            name: finalCharacter.name || name,
                            description: agent.description,
                            role: 'Omniflow Agent',
                            persona: persona, // Store original persona for reference
                            traits: finalCharacter.traits,
                            instructions: finalCharacter.instructions,
                            consoleOutput: [`[${new Date().toLocaleTimeString()}] Agent ${name} initialized with enriched persona.`]
                        }
                    });
                }

                if (graph?.edges) {
                    await AgentEdge.insertMany(graph.edges.map((e: any) => ({
                        agentId: agent._id,
                        edgeId: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle,
                        label: e.label,
                        data: e.data
                    })));
                }

                return reply.code(201).send(agent);
            } catch (err) {
                console.error('Failed to create agent:', err);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );

    // Update an existing agent (Handles Auto-save and Persona Re-enhancement)
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; persona?: string; graph?: any; identities?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string } }>(
        '/agents/:id',
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { name, description, persona, graph, identities, isDraft, provider, apiKey, model } = request.body;

                const agent = await AgentDefinition.findById(id);
                if (!agent) return reply.code(404).send({ error: 'Agent not found' });

                if (name) agent.name = name;
                if (description !== undefined) agent.description = description;
                if (identities) agent.identities = identities;
                if (isDraft !== undefined) agent.isDraft = isDraft;
                if (provider) agent.modelProvider = provider as any;
                else if (!agent.modelProvider) agent.modelProvider = 'ollama';

                if (model) agent.modelConfig.modelName = model;

                // Re-enhance character if persona is updated (skip if already provided/reviewed)
                if (persona && persona !== agent.persona && (!agent.character?.bio || !agent.character?.instructions)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name || agent.name, persona, provider || agent.modelProvider, apiKey, model || agent.modelConfig.modelName);
                        if (!enhanced.bio || !enhanced.instructions) {
                            throw new Error('AI generated an incomplete character.');
                        }
                        agent.character = {
                            ...agent.character,
                            ...enhanced
                        };
                        agent.persona = persona;
                        request.log.info(`[AgentStudio] Successfully re-generated AI character for: ${agent.name}`);

                        // Also update the description if it was using the bio
                        if (!description) agent.description = (enhanced as any).description || agent.character?.bio;
                    } catch (error: any) {
                        request.log.error('Persona re-enhancement failed: ' + error);
                        return reply.code(400).send({ error: 'Persona expansion failed', details: error.message });
                    }
                }

                await agent.save();

                // Atomically replace nodes and edges if graph is provided
                if (graph) {
                    if (graph.nodes) {
                        await AgentNode.deleteMany({ agentId: id });
                        await AgentNode.insertMany(graph.nodes.map((n: any) => ({
                            agentId: agent._id,
                            nodeId: n.id,
                            type: n.type,
                            position: n.position,
                            chain: n.data?.chain,
                            tool: n.data?.tool,
                            params: n.data?.params,
                            data: n.data
                        })));
                    }

                    if (graph.edges) {
                        await AgentEdge.deleteMany({ agentId: id });
                        await AgentEdge.insertMany(graph.edges.map((e: any) => ({
                            agentId: agent._id,
                            edgeId: e.id,
                            source: e.source,
                            target: e.target,
                            sourceHandle: e.sourceHandle,
                            targetHandle: e.targetHandle,
                            label: e.label,
                            data: e.data
                        })));
                    }
                }

                return agent;
            } catch (err) {
                console.error('Update failed:', err);
                return reply.code(500).send({ error: 'Failed to update agent' });
            }
        }
    );
};
