import { FastifyPluginAsync } from 'fastify';
import { AgentDefinition } from '../models/AgentDefinition';
import { AgentNode } from '../models/AgentNode';
import { AgentEdge } from '../models/AgentEdge';
import { Workspace } from '../models/Workspace';
import { AgentEnhancer } from '../services/AgentEnhancer';
import { validateCharacter } from '../characters/validator';
import { WalletService } from '../services/WalletService';
import { Orchestrator } from '../engine/orchestrator';
import { Readable } from 'stream';

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
    fastify.post<{ Body: { name: string; persona: string; provider?: string; apiKey?: string; model?: string; agentType?: string } }>(
        '/agents/enhance',
        async (request, reply) => {
            try {
                const { name, persona, provider, apiKey, model, agentType = 'operational_agent' } = request.body;
                if (!name || !persona) return reply.code(400).send({ error: 'Name and Persona are required' });

                const enhanced = await AgentEnhancer.enhancePersona(name, persona, provider, apiKey, model, agentType);
                return enhanced;
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }
        }
    );

    // Create a new agent
    fastify.post<{ Body: { name: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; provider?: string; apiKey?: string; model?: string; agentType?: string; chain?: string } }>(
        '/agents',
        async (request, reply) => {
            try {
                const token = request.cookies['auth_token'];
                if (!token) return reply.code(401).send({ error: 'Unauthorized' });

                const decoded = fastify.jwt.verify(token) as any;
                const { name, description, persona, graph, identities, character, isDraft, provider, apiKey, model, agentType = 'operational_agent', chain } = request.body;

                const workspace = await Workspace.findOne({ ownerId: decoded.id });
                if (!workspace) return reply.code(404).send({ error: 'No workspace found' });

                let finalCharacter = character || {};

                // If persona is provided, use AI to enhance the character bio/traits (skip if already provided/reviewed)
                if (persona && (!finalCharacter.character?.bio || Object.keys(finalCharacter).length <= 1)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name, persona, provider, apiKey, model, agentType);
                        if (!enhanced.character || !enhanced.identity) {
                            throw new Error('AI generated an incomplete character. Please try a more detailed persona summary.');
                        }
                        finalCharacter = enhanced;
                        request.log.info(`[AgentStudio] Successfully generated AI character for: ${name}`);
                    } catch (error: any) {
                        request.log.error('Persona enhancement failed: ' + error);
                        return reply.code(400).send({
                            error: 'Persona expansion failed',
                            details: error.message || 'The AI was unable to generate a valid character from your persona summary.'
                        });
                    }
                }

                // Strict validation using AJV
                const validationResult = validateCharacter(agentType, finalCharacter);
                if (!validationResult.isValid) {
                    return reply.code(400).send({
                        error: 'Character Schema Validation Failed',
                        details: validationResult.errors
                    });
                }

                const agent = new AgentDefinition({
                    ownerId: decoded.id,
                    workspaceId: workspace._id,
                    name,
                    persona,
                    description: description || finalCharacter.identity?.description || finalCharacter.character?.bio || '',
                    identities: identities || {},
                    character: finalCharacter,
                    agentType: agentType as any,
                    modelProvider: provider || 'ollama',
                    modelConfig: {
                        modelName: model || 'qwen2.5:3b'
                    },
                    isDraft: isDraft ?? true
                });

                // Auto-provision wallet if chain is provided
                if (chain) {
                    try {
                        const wallet = await WalletService.generateWallet(chain);
                        agent.blockchain = [wallet as any];
                        request.log.info(`[AgentRoutes] Auto-provisioned ${chain} wallet for: ${name}`);
                    } catch (walletErr) {
                        request.log.error(`[AgentRoutes] Wallet provisioning failed for ${chain}: ${walletErr}`);
                    }
                }

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
                            name: finalCharacter.identity?.name || name,
                            description: agent.description,
                            role: finalCharacter.identity?.role || 'FlawLess Agent',
                            persona: persona, // Store original persona for reference
                            traits: finalCharacter.character?.traits || [],
                            agentType: agentType,
                            consoleOutput: [`[${new Date().toLocaleTimeString()}] Agent ${name} initialized with enriched ${agentType} persona.`]
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

                // Re-enhance character if persona is updated (skip if already provided/reviewed)
                if (persona && persona !== agent.persona && (!intermediateCharacter.character?.bio || Object.keys(intermediateCharacter).length <= 1)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name || agent.name, persona, provider || agent.modelProvider, apiKey, model || agent.modelConfig.modelName, currentAgentType);
                        if (!enhanced.character || !enhanced.identity) {
                            throw new Error('AI generated an incomplete character.');
                        }
                        intermediateCharacter = enhanced;
                        agent.persona = persona;
                        request.log.info(`[AgentStudio] Successfully re-generated AI character for: ${agent.name}`);

                        // Also update the description if it was using the bio
                        if (!description) agent.description = enhanced.identity?.description || enhanced.character?.bio;
                    } catch (error: any) {
                        request.log.error('Persona re-enhancement failed: ' + error);
                        return reply.code(400).send({ error: 'Persona expansion failed', details: error.message });
                    }
                }

                // Strict validation using AJV
                if (Object.keys(intermediateCharacter).length > 0) {
                    const validationResult = validateCharacter(currentAgentType, intermediateCharacter);
                    if (!validationResult.isValid) {
                        return reply.code(400).send({
                            error: 'Character Schema Validation Failed',
                            details: validationResult.errors
                        });
                    }
                    agent.character = intermediateCharacter;
                }

                if (agentType) agent.agentType = agentType as any;

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

    // Delete an agent
    fastify.delete<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const agent = await AgentDefinition.findByIdAndDelete(id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });

            // Also delete associated nodes and edges
            await AgentNode.deleteMany({ agentId: id });
            await AgentEdge.deleteMany({ agentId: id });

            return { message: 'Agent and associated data deleted successfully' };
        } catch (err) {
            console.error('Delete failed:', err);
            return reply.code(500).send({ error: 'Failed to delete agent' });
        }
    });

    // Create an agent from a template
    fastify.post<{ Body: { templateId: string; name: string; modelProvider?: string; modelName?: string; apiKey?: string } }>('/agents/from-template', async (request, reply) => {
        try {
            const token = request.cookies['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });

            const decoded = fastify.jwt.verify(token) as any;
            const { templateId, name, modelProvider = 'ollama', modelName = 'qwen2.5:3b', apiKey } = request.body;

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

            const { agentTemplates } = require('../lib/templates');
            const template = agentTemplates.find((t: any) => t.id === templateId);

            if (!template) return reply.code(404).send({ error: 'Template not found' });

            // Generate AI character persona based on template description
            let character = {};
            let description = template.description;

            try {
                const enhanced = await AgentEnhancer.enhancePersona(name, template.description, modelProvider, apiKey, modelName);
                character = enhanced;
                if (enhanced.description) description = enhanced.description;
            } catch (err) {
                console.warn('[AgentRoutes] AI Enhancement failed, using default description:', err);
            }

            // Create Agent
            const agent = new AgentDefinition({
                ownerId: decoded.id,
                workspaceId: workspace._id,
                name,
                description,
                character,
                persona: template.description, // Store original template description as persona seed
                modelProvider,
                modelConfig: {
                    modelName: modelName
                },
                isDraft: true,
                graph: {
                    nodes: template.nodes,
                    edges: template.edges
                }
            });

            await agent.save();

            // Create associated nodes and edges for simulation engine
            for (const node of template.nodes) {
                await AgentNode.create({
                    nodeId: node.id,
                    agentId: agent._id,
                    type: node.type,
                    position: node.position,
                    data: node.data
                });
            }

            for (const edge of template.edges) {
                await AgentEdge.create({
                    edgeId: edge.id,
                    agentId: agent._id,
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle
                });
            }

            return agent;
        } catch (err) {
            console.error('Create from template failed:', err);
            return reply.code(500).send({ error: 'Failed to create agent from template' });
        }
    });

    // Unified Agent Query Endpoint
    fastify.post<{ Body: { prompt: string; agentId: string; sessionId: string } }>(
        '/agent/query',
        async (request, reply) => {
            const { prompt, agentId, sessionId } = request.body;
            // Assumes user authentication in a real scenario
            const userId = (request as any).user?.id || '60c72b2f9b1d8e1f4c8b4567'; // Fallback for dev

            try {
                // Return an SSE stream
                const readable = new Readable({
                    read() { }
                });

                // Start orchestrator async and push to readable stream
                Orchestrator.handleQuery(prompt, agentId, userId, sessionId, readable)
                    .then(() => {
                        readable.push(null); // End stream
                    })
                    .catch((err) => {
                        console.error('[Agent Query Error]', err);
                        readable.push(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                        readable.push(null);
                    });

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
