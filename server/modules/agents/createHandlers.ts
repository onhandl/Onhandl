import { FastifyPluginAsync } from 'fastify';
import { AgentDefinition } from '../../models/AgentDefinition';
import { AgentNode } from '../../models/AgentNode';
import { AgentEdge } from '../../models/AgentEdge';
import { Workspace } from '../../models/Workspace';
import { User } from '../../models/User';
import { AgentEnhancer } from '../../services/AgentEnhancer';
import { validateCharacter } from '../../characters/validator';
import { WalletService } from '../../services/WalletService';
import { ENV } from '../../lib/environments';

async function saveGraphData(agentId: any, graph: any, fallbackNode: any) {
    if (graph?.nodes && graph.nodes.length > 0) {
        await AgentNode.insertMany(graph.nodes.map((n: any) => ({
            agentId, nodeId: n.id, type: n.type, position: n.position,
            chain: n.data?.chain, tool: n.data?.tool, params: n.data?.params, data: n.data
        })));
    } else if (fallbackNode) {
        await AgentNode.create(fallbackNode);
    }
    if (graph?.edges) {
        await AgentEdge.insertMany(graph.edges.map((e: any) => ({
            agentId, edgeId: e.id, source: e.source, target: e.target,
            sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, data: e.data
        })));
    }
}

/** Resolve the best AI provider + key from user profile keys → DEFAULT_AI_PROVIDER env → ollama */
function resolveProviderKeys(userApiKeys: any): { provider: string; apiKey?: string; model?: string } {
    const k = userApiKeys || {};

    // User-supplied keys take priority (explicit user choice)
    if (k.gemini) return { provider: 'gemini', apiKey: k.gemini };
    if (k.openai) return { provider: 'openai', apiKey: k.openai, model: k.openaiModel || undefined };
    if (k.ollamaBaseUrl) return { provider: 'ollama', apiKey: k.ollamaBaseUrl, model: k.ollamaModel || 'qwen2.5:3b' };

    // Fall back to the system default provider (set via DEFAULT_AI_PROVIDER in .env)
    const def = ENV.DEFAULT_AI_PROVIDER;
    if (def === 'gemini' && ENV.GEMINI_API_KEY) return { provider: 'gemini', apiKey: ENV.GEMINI_API_KEY };
    if (def === 'openai' && ENV.OPENAI_API_KEY) return { provider: 'openai', apiKey: ENV.OPENAI_API_KEY };

    // Always fall back to local Ollama
    return { provider: 'ollama', model: ENV.OLLAMA_MODEL || 'qwen2.5:3b' };
}

export const createAgentRoutes: FastifyPluginAsync = async (fastify) => {

    // Preview AI persona enhancement (no agent created)
    fastify.post<{ Body: { name: string; persona: string; agentType?: string; chains?: string[] } }>(
        '/agents/enhance',
        async (request, reply) => {
            try {
                const { name, persona, agentType = 'operational_agent', chains = [] } = request.body;
                if (!name || !persona) return reply.code(400).send({ error: 'Name and Persona are required' });

                const token = request.cookies['auth_token'];
                let providerKeys = resolveProviderKeys({});
                if (token) {
                    try {
                        const decoded = fastify.jwt.verify(token) as any;
                        const user = await User.findById(decoded.id).select('apiKeys').lean();
                        providerKeys = resolveProviderKeys((user as any)?.apiKeys);
                    } catch { }
                }

                return await AgentEnhancer.enhancePersona(
                    name, persona, providerKeys.provider, providerKeys.apiKey, providerKeys.model, agentType, chains
                );
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }
        }
    );

    // Create a new agent
    fastify.post<{ Body: { name: string; description?: string; persona?: string; graph?: any; identities?: any; character?: any; isDraft?: boolean; agentType?: string; chains?: string[] } }>(
        '/agents',
        async (request, reply) => {
            try {
                const token = request.cookies['auth_token'];
                if (!token) return reply.code(401).send({ error: 'Unauthorized' });

                const decoded = fastify.jwt.verify(token) as any;
                const { name, description, persona, graph, identities, character, isDraft, agentType = 'operational_agent', chains } = request.body;

                const [workspace, user] = await Promise.all([
                    Workspace.findOne({ ownerId: decoded.id }),
                    User.findById(decoded.id).select('apiKeys').lean(),
                ]);
                if (!workspace) return reply.code(404).send({ error: 'No workspace found' });

                const { provider, apiKey, model } = resolveProviderKeys((user as any)?.apiKeys);

                let finalCharacter = character || {};

                if (persona && (!finalCharacter.character?.bio || Object.keys(finalCharacter).length <= 1)) {
                    try {
                        const enhanced = await AgentEnhancer.enhancePersona(name, persona, provider, apiKey, model, agentType, chains);
                        if (!enhanced.character || !enhanced.identity) throw new Error('AI generated an incomplete character. Please try a more detailed persona summary.');
                        finalCharacter = enhanced;
                    } catch (error: any) {
                        request.log.error('Persona enhancement failed: ' + error);
                        return reply.code(400).send({ error: 'Persona expansion failed', details: error.message });
                    }
                }

                const validationResult = validateCharacter(agentType, finalCharacter);
                if (!validationResult.isValid) return reply.code(400).send({ error: 'Character Schema Validation Failed', details: validationResult.errors });

                const agent = new AgentDefinition({
                    ownerId: decoded.id, workspaceId: workspace._id, name, persona,
                    description: description || finalCharacter.identity?.description || finalCharacter.character?.bio || '',
                    identities: identities || {}, character: finalCharacter,
                    agentType: agentType as any, modelProvider: provider as any,
                    modelConfig: { modelName: model || 'qwen2.5:3b' }, isDraft: isDraft ?? true
                });

                // Generate wallets for each requested chain
                if (chains && chains.length > 0) {
                    const wallets: any[] = [];
                    for (const chain of chains) {
                        try { wallets.push(await WalletService.generateWallet(chain) as any); } catch { }
                    }
                    if (wallets.length > 0) agent.blockchain = wallets;
                }

                await agent.save();

                // Deduct 300 tokens for agent creation
                await User.findByIdAndUpdate(decoded.id, { $inc: { tokens: -300 } });

                const fallbackNode = {
                    agentId: agent._id, nodeId: `character-${Date.now()}`, type: 'input',
                    position: { x: 100, y: 100 },
                    data: { name: finalCharacter.identity?.name || name, description: agent.description, role: finalCharacter.identity?.role || 'Onhandl Agent', persona, traits: finalCharacter.character?.traits || [], agentType, consoleOutput: [`[${new Date().toLocaleTimeString()}] Agent ${name} initialized.`] }
                };
                await saveGraphData(agent._id, graph, fallbackNode);

                return reply.code(201).send(agent);
            } catch (err) {
                console.error('Failed to create agent:', err);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );

    // Create agent from template
    fastify.post<{ Body: { templateId: string; name: string } }>(
        '/agents/from-template',
        async (request, reply) => {
            try {
                const token = request.cookies['auth_token'];
                if (!token) return reply.code(401).send({ error: 'Unauthorized' });

                const decoded = fastify.jwt.verify(token) as any;
                const { templateId, name } = request.body;

                let workspace = await Workspace.findOne({ ownerId: decoded.id });
                if (!workspace) {
                    workspace = new Workspace({ name: 'Default Workspace', ownerId: decoded.id, members: [decoded.id] });
                    await workspace.save();
                }

                const user = await User.findById(decoded.id).select('apiKeys').lean();
                const { provider, model } = resolveProviderKeys((user as any)?.apiKeys);

                const { agentTemplates } = require('../../lib/templates');
                const template = agentTemplates.find((t: any) => t.id === templateId);
                if (!template) return reply.code(404).send({ error: 'Template not found' });

                const agent = new AgentDefinition({
                    ownerId: decoded.id, workspaceId: workspace._id, name,
                    description: template.description, character: template.character || {},
                    agentType: template.agentType || 'operational_agent', persona: template.description,
                    modelProvider: provider as any, modelConfig: { modelName: model || 'qwen2.5:3b' }, isDraft: true,
                    graph: { nodes: template.nodes, edges: template.edges }
                });
                await agent.save();

                for (const node of template.nodes) {
                    await AgentNode.create({ nodeId: node.id, agentId: agent._id, type: node.type, position: node.position, data: node.data });
                }
                for (const edge of template.edges) {
                    await AgentEdge.create({ edgeId: edge.id, agentId: agent._id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle });
                }

                return agent;
            } catch (err) {
                console.error('Create from template failed:', err);
                return reply.code(500).send({ error: 'Failed to create agent from template' });
            }
        }
    );
};
