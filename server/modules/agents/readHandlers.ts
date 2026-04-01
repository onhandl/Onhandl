import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { AgentDefinition } from '../../models/AgentDefinition';
import { AgentNode } from '../../models/AgentNode';
import { AgentEdge } from '../../models/AgentEdge';
import { Workspace } from '../../models/Workspace';
import { User } from '../../models/User';
import { Purchase } from '../../models/Purchase';
import { PLANS } from '../../lib/tokens';

/** Format a Date → "Jan 15" label for chart axes */
function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Safe ISO date string (yyyy-mm-dd) from any Date-like value */
function isoDay(d: any): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
}

export const readAgentRoutes: FastifyPluginAsync = async (fastify) => {

    // ── STATIC ROUTES first (must precede parametric /:id) ──────────────────

    // List all agents for the authenticated user's workspace
    // Query params: status = all|published|drafts|listed  |  search = text
    fastify.get<{ Querystring: { isDraft?: string; status?: string; search?: string } }>('/agents', async (request, reply) => {
        try {
            const token = request.cookies['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });

            const decoded = fastify.jwt.verify(token) as any;
            const { isDraft, status, search } = request.query;

            let workspace = await Workspace.findOne({ ownerId: decoded.id });
            if (!workspace) {
                workspace = new Workspace({ name: 'Default Workspace', ownerId: decoded.id, members: [decoded.id] });
                await workspace.save();
            }

            const filter: any = { workspaceId: workspace._id };

            if (status === 'published')      filter.isDraft = false;
            else if (status === 'drafts')    filter.isDraft = true;
            else if (status === 'listed')    filter['marketplace.published'] = true;
            else if (isDraft !== undefined)  filter.isDraft = isDraft === 'true';

            if (search?.trim()) {
                const regex = new RegExp(search.trim(), 'i');
                filter.$or = [{ name: regex }, { description: regex }];
            }

            return await AgentDefinition.find(filter).sort({ updatedAt: -1 });
        } catch {
            return reply.code(401).send({ error: 'Invalid token' });
        }
    });

    // Revenue dashboard — all-agents overview
    fastify.get('/agents/revenue', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        let decoded: any;
        try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

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
        const totalViews     = agents.reduce((s, a) => s + (Number((a.marketplace as any)?.stats?.views)     || 0), 0);
        const totalPurchases = purchases.length;
        const totalRevenue   = purchases.reduce((s, p) => s + (p.amount || 0), 0);

        // 30-day chart (friendly date labels)
        const now = new Date();
        const chartData: { date: string; purchases: number; revenue: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStr = isoDay(d);
            const label  = fmtDate(d);
            const dayP   = purchases.filter(p => isoDay(p.createdAt) === dayStr);
            chartData.push({
                date:      label,
                purchases: dayP.length,
                revenue:   dayP.reduce((s, p) => s + (p.amount || 0), 0),
            });
        }

        // Per-agent breakdown (purchases matched from real Purchase docs)
        const agentBreakdown = agents.map(a => {
            const mkt = (a.marketplace as any) || {};
            const ap  = purchases.filter(p => String(p.agentId) === String(a._id));
            return {
                _id:       a._id,
                name:      a.name,
                description: a.description,
                agentType: a.agentType,
                isDraft:   a.isDraft,
                published: mkt.published  || false,
                category:  mkt.category,
                views:     Number(mkt.stats?.views)     || 0,
                purchases: ap.length,
                revenue:   ap.reduce((s: number, p: any) => s + (p.amount || 0), 0),
                pricing:   mkt.pricing,
            };
        });

        return { agents: agentBreakdown, totalViews, totalPurchases, totalRevenue, chartData };
    });

    // Plan status
    fastify.get('/agents/plan-status', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        let decoded: any;
        try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

        const user = await User.findById(decoded.id).select('tokens plan planExpiry');
        if (!user) return reply.code(404).send({ error: 'User not found' });

        const workspace  = await Workspace.findOne({ ownerId: decoded.id });
        const agentCount = workspace ? await AgentDefinition.countDocuments({ workspaceId: workspace._id }) : 0;
        const plan       = PLANS[user.plan || 'free'];

        return {
            plan: user.plan, tokens: user.tokens, agentCount,
            agentLimit: plan.agentLimit, atLimit: plan.agentLimit !== -1 && agentCount >= plan.agentLimit,
            canDelete: plan.canDelete, canReEdit: plan.canReEdit,
        };
    });

    // ── PARAMETRIC ROUTES after static ──────────────────────────────────────

    // Per-agent stats — real purchase history + 30-day chart
    fastify.get<{ Params: { id: string } }>('/agents/:id/stats', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        try { fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

        const agent = await AgentDefinition.findById(request.params.id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const purchases = await Purchase.find({ agentId: request.params.id }).sort({ createdAt: -1 });
        const mkt       = (agent.marketplace as any) || {};

        const now = new Date();
        const chartData: { date: string; purchases: number; revenue: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d      = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStr = isoDay(d);
            const label  = fmtDate(d);
            const dayP   = purchases.filter(p => isoDay(p.createdAt) === dayStr);
            chartData.push({ date: label, purchases: dayP.length, revenue: dayP.reduce((s, p) => s + (p.amount || 0), 0) });
        }

        return {
            views:     Number(mkt.stats?.views)  || 0,
            purchases: purchases.length,
            revenue:   purchases.reduce((s, p) => s + (p.amount || 0), 0),
            rating:    Number(mkt.stats?.rating) || 0,
            chartData,
        };
    });

    // Get a specific agent with reconstructed graph
    fastify.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const agent  = await AgentDefinition.findById(id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });

            const [nodes, edges] = await Promise.all([
                AgentNode.find({ agentId: id }),
                AgentEdge.find({ agentId: id }),
            ]);

            return {
                ...agent.toObject(),
                graph: {
                    nodes: nodes.map(n => ({ id: n.nodeId, type: n.type, position: n.position, data: { ...n.data, chain: n.chain, tool: n.tool, params: n.params } })),
                    edges: edges.map(e => ({ id: e.edgeId, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, data: e.data })),
                },
            };
        } catch {
            return reply.code(500).send({ error: 'Failed to fetch agent' });
        }
    });

    // Public: view agent character JSON
    fastify.get<{ Params: { id: string } }>('/agents/:id.json', async (request, reply) => {
        try {
            const agent = await AgentDefinition.findById(request.params.id);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });
            return { agentId: agent._id, name: agent.name, persona: agent.persona, character: agent.character || {} };
        } catch {
            return reply.code(500).send({ error: 'Failed to fetch agent JSON' });
        }
    });
};
