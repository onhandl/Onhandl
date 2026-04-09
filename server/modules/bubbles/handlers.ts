import { FastifyRequest, FastifyReply } from 'fastify';
import { Bubble } from '../../models/Bubble';
import { GossipMessage } from '../../models/GossipMessage';
import { AgentDefinition } from '../../models/AgentDefinition';
import { GossipSubscription } from '../../models/GossipSubscription';
import { interfacesCompatible } from '../../lib/gossipCatalogs';
import { gossipEngine } from '../../engine/gossip/GossipEngine';

async function resolveOwner(request: FastifyRequest): Promise<string> {
    const token = (request as any).cookies?.['auth_token'];
    const decoded = request.server.jwt.verify(token) as any;
    return decoded.id;
}

// GET /api/bubbles
export async function listBubbles(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const bubbles = await Bubble.find({ ownerId }).sort({ createdAt: -1 }).lean();
        return reply.send(bubbles);
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// POST /api/bubbles
export async function createBubble(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { name, description, agentIds = [], gossipInterval = 8, fanout = 2 } = request.body as any;

        if (!name) return reply.code(400).send({ error: 'name is required' });

        // Verify agents belong to this owner
        const agents = await AgentDefinition.find({ _id: { $in: agentIds }, ownerId }).select('_id').lean();
        const validIds = agents.map(a => String(a._id));

        // Derive workspaceId from first agent or owner fallback
        const firstAgent = await AgentDefinition.findOne({ ownerId }).select('workspaceId').lean();
        const workspaceId = firstAgent?.workspaceId;

        const bubble = await Bubble.create({ ownerId, workspaceId, name, description, agentIds: validIds, gossipInterval, fanout });

        if (bubble.status === 'active' && validIds.length > 0) {
            gossipEngine.startBubble(String(bubble._id), validIds, gossipInterval, fanout);
        }

        return reply.code(201).send(bubble);
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}

// GET /api/bubbles/:id
export async function getBubble(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { id } = request.params as any;
        const bubble = await Bubble.findOne({ _id: id, ownerId }).lean();
        if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });

        const agents = await AgentDefinition.find({ _id: { $in: bubble.agentIds } })
            .select('name agentType status modelProvider')
            .lean();

        return reply.send({ ...bubble, agents });
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// PUT /api/bubbles/:id
export async function updateBubble(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { id }  = request.params as any;
        const { name, description, agentIds, status, gossipInterval, fanout } = request.body as any;

        const bubble = await Bubble.findOne({ _id: id, ownerId });
        if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });

        if (name !== undefined)           bubble.name           = name;
        if (description !== undefined)    bubble.description    = description;
        if (gossipInterval !== undefined) bubble.gossipInterval = gossipInterval;
        if (fanout !== undefined)         bubble.fanout         = fanout;

        if (agentIds !== undefined) {
            const agents = await AgentDefinition.find({ _id: { $in: agentIds }, ownerId }).select('_id').lean();
            bubble.agentIds = agents.map(a => a._id) as any;

            // Soft compatibility check — warn but still allow
            const warnings: string[] = [];
            if (bubble.requiredInterfaces?.length > 0) {
                const subs = await GossipSubscription.find({ agentId: { $in: agentIds } }).lean();
                const subMap = new Map(subs.map(s => [String(s.agentId), s]));
                for (const a of agents) {
                    const sub = subMap.get(String(a._id));
                    if (!sub) { warnings.push(`Agent ${a._id} has no gossip subscription`); continue; }
                    if (!interfacesCompatible(sub.interfaces, bubble.requiredInterfaces)) {
                        warnings.push(`Agent ${a._id} has incompatible interfaces`);
                    }
                }
            }
            if (warnings.length > 0) (bubble as any)._warnings = warnings;
        }

        if (status !== undefined) {
            bubble.status = status;
            if (status === 'active') {
                gossipEngine.startBubble(id, bubble.agentIds.map(String), bubble.gossipInterval, bubble.fanout);
            } else {
                gossipEngine.stopBubble(id);
            }
        }

        const warnings = (bubble as any)._warnings as string[] | undefined;
        await bubble.save();
        return reply.send({ ...bubble.toObject(), warnings: warnings ?? [] });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}

// DELETE /api/bubbles/:id
export async function deleteBubble(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { id }  = request.params as any;
        const bubble  = await Bubble.findOneAndDelete({ _id: id, ownerId });
        if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });
        gossipEngine.stopBubble(id);
        await GossipMessage.deleteMany({ bubbleId: id });
        return reply.send({ success: true });
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// GET /api/bubbles/:id/messages?limit=50&page=1
export async function getMessages(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { id }  = request.params as any;
        const bubble  = await Bubble.findOne({ _id: id, ownerId }).lean();
        if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });

        const { limit = '50', page = '1' } = request.query as any;
        const lim  = Math.min(parseInt(limit), 100);
        const skip = (parseInt(page) - 1) * lim;

        const messages = await GossipMessage.find({ bubbleId: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim)
            .lean();

        return reply.send(messages.reverse());
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// POST /api/bubbles/:id/task
export async function submitTask(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { id }  = request.params as any;
        const { task } = request.body as any;

        if (!task) return reply.code(400).send({ error: 'task is required' });

        const bubble = await Bubble.findOne({ _id: id, ownerId }).lean();
        if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });
        if (bubble.agentIds.length === 0) return reply.code(400).send({ error: 'Bubble has no agents' });

        await gossipEngine.injectTaskRequest(id, bubble.agentIds.map(String), task);

        return reply.send({ success: true, task });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}
