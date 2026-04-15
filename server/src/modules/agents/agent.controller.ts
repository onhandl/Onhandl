import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { AgentNode } from '../../infrastructure/database/models/AgentNode';
import { AgentEdge } from '../../infrastructure/database/models/AgentEdge';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { User } from '../../infrastructure/database/models/User';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { PLANS, PlanId } from '../../shared/constants/tokens';
import { verifyAuthCookie } from '../../api/middlewares/auth';
import { AgentEnhancer } from './agent-enhancer.service';
import { validateCharacter } from '../../core/characters/validator';
import { WalletService } from '../../infrastructure/blockchain/wallet.service';
import { ENV } from '../../shared/config/environments';
import { Orchestrator } from '../../core/engine/orchestrator';
import { Readable } from 'stream';

/** Format a Date → "Jan 15" label for chart axes */
function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Safe ISO date string (yyyy-mm-dd) from any Date-like value */
function isoDay(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
}

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

export const readAgentRoutes: FastifyPluginAsync = async (fastify) => {

    // ── STATIC ROUTES first (must precede parametric /:id) ──────────────────

    // List all agents for the authenticated user's workspace
    // Query params: status = all|published|drafts|listed  |  search = text
    fastify.get<{ Querystring: { isDraft?: string; status?: string; search?: string } }>('/agents', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { isDraft, status, search } = request.query;

        let workspace = await Workspace.findOne({ ownerId: decoded.id });
        if (!workspace) {
            workspace = new Workspace({ name: 'Default Workspace', ownerId: decoded.id, members: [decoded.id] });
            await workspace.save();
        }

        const filter: Record<string, unknown> = { workspaceId: workspace._id };

        if (status === 'published') filter.isDraft = false;
        else if (status === 'drafts') filter.isDraft = true;
        else if (status === 'listed') filter['marketplace.published'] = true;
        else if (isDraft !== undefined) filter.isDraft = isDraft === 'true';

        if (search?.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: regex }, { description: regex }];
        }

        return await AgentDefinition.find(filter).sort({ updatedAt: -1 });
    });

    // Revenue dashboard — all-agents overview
    fastify.get('/agents/revenue', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const sellerOid = new mongoose.Types.ObjectId(decoded.id);
        const workspace = await Workspace.findOne({ ownerId: sellerOid });
        if (!workspace) return { agents: [], totalViews: 0, totalPurchases: 0, totalRevenue: 0, chartData: [] };

        const [agents, purchases] = await Promise.all([
            AgentDefinition.find({ workspaceId: workspace._id })
                .select('name description marketplace agentType isDraft createdAt ownerId'),
            Purchase.find({ sellerId: sellerOid })
                .sort({ createdAt: -1 }),
        ]);

        // Totals from real data sources
        const totalViews = agents.reduce((s: number, a: any) => s + (Number((a.marketplace as any)?.stats?.views) || 0), 0);
        const totalPurchases = purchases.length;
        const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);

        // 30-day chart (friendly date labels)
        const now = new Date();
        const chartData: { date: string; purchases: number; revenue: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStr = isoDay(d);
            const label = fmtDate(d);
            const dayP = purchases.filter((p: any) => isoDay(p.createdAt) === dayStr);
            chartData.push({
                date: label,
                purchases: dayP.length,
                revenue: dayP.reduce((s, p) => s + (p.amount || 0), 0),
            });
        }

        // Per-agent breakdown (purchases matched from real Purchase docs)
        const agentBreakdown = agents.map((a: any) => {
            const mkt = (a.marketplace as any) || {};
            const ap = purchases.filter((p: any) => String(p.agentId) === String(a._id));
            return {
                _id: a._id,
                name: a.name,
                description: a.description,
                agentType: a.agentType,
                isDraft: a.isDraft,
                published: mkt.published || false,
                category: mkt.category,
                views: Number(mkt.stats?.views) || 0,
                purchases: ap.length,
                revenue: ap.reduce((s: number, p: any) => s + (p.amount || 0), 0),
                pricing: mkt.pricing,
            };
        });

        return { agents: agentBreakdown, totalViews, totalPurchases, totalRevenue, chartData };
    });

    // Plan status
    fastify.get('/agents/plan-status', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const user = await User.findById(decoded.id).select('tokens plan planExpiry');
        if (!user) return reply.code(404).send({ error: 'User not found' });

        const workspace = await Workspace.findOne({ ownerId: decoded.id });
        const agentCount = workspace ? await AgentDefinition.countDocuments({ workspaceId: workspace._id }) : 0;
        const plan = PLANS[(user.plan as PlanId) || 'free'];

        return {
            plan: user.plan, tokens: user.tokens, agentCount,
            agentLimit: plan.agentLimit, atLimit: plan.agentLimit !== -1 && agentCount >= plan.agentLimit,
            canDelete: plan.canDelete, canReEdit: plan.canReEdit,
        };
    });

    // ── PARAMETRIC ROUTES after static ──────────────────────────────────────

    // Per-agent stats — real purchase history + 30-day chart
    fastify.get<{ Params: { id: string } }>('/agents/:id/stats', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const agent = await AgentDefinition.findById(request.params.id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const purchases = await Purchase.find({ agentId: request.params.id }).sort({ createdAt: -1 });
        const mkt = (agent.marketplace as any) || {};

        const now = new Date();
        const chartData: { date: string; purchases: number; revenue: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStr = isoDay(d);
            const label = fmtDate(d);
            const dayP = purchases.filter((p: any) => isoDay(p.createdAt) === dayStr);
            chartData.push({ date: label, purchases: dayP.length, revenue: dayP.reduce((s, p) => s + (p.amount || 0), 0) });
        }

        return {
            views: Number(mkt.stats?.views) || 0,
            purchases: purchases.length,
            revenue: purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0),
            rating: Number(mkt.stats?.rating) || 0,
            chartData,
        };
    });

    // Get a specific agent with reconstructed graph
    fastify.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        const { id } = request.params;
        const agent = await AgentDefinition.findById(id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const [nodes, edges] = await Promise.all([
            AgentNode.find({ agentId: id }),
            AgentEdge.find({ agentId: id }),
        ]);

        return {
            ...agent.toObject(),
            graph: {
                nodes: nodes.map(n => ({ id: n.nodeId, type: n.type, position: n.position, data: { ...n.data, chain: n.chain, tool: n.tool, params: n.params } })),
                edges: edges.map((e: any) => ({ id: e.edgeId, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, data: e.data })),
            },
        };
    });

    // Public: view agent character JSON
    fastify.get<{ Params: { id: string } }>('/agents/:id.json', async (request, reply) => {
        const agent = await AgentDefinition.findById(request.params.id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        return { agentId: agent._id, name: agent.name, persona: agent.persona, character: agent.character || {} };
    });
};

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
                    data: { name: finalCharacter.identity?.name || name, description: agent.description, role: finalCharacter.identity?.role || 'Onhandl Agent', persona, traits: finalCharacter.character?.traits || [], agentType, consoleOutput: [[`[${new Date().toLocaleTimeString()}] Agent ${name} initialized.`]] }
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

export const agentRoutes: FastifyPluginAsync = async (app) => {
    app.register(readAgentRoutes);
    app.register(createAgentRoutes);
    app.register(updateAgentRoutes);
};
