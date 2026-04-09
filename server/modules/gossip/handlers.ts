import { FastifyRequest, FastifyReply } from 'fastify';
import { GossipSubscription } from '../../models/GossipSubscription';
import { AgentDefinition } from '../../models/AgentDefinition';
import { GOSSIP_CATALOGS, interfacesCompatible } from '../../lib/gossipCatalogs';

async function resolveOwner(request: FastifyRequest): Promise<string> {
    const token = (request as any).cookies?.['auth_token'];
    const decoded = request.server.jwt.verify(token) as any;
    return decoded.id;
}

// GET /api/gossip/catalogs — return all available catalogs + interfaces
export async function getCatalogs(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send(GOSSIP_CATALOGS);
}

// GET /api/gossip/subscriptions — list all subscriptions for this owner
export async function listSubscriptions(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const subs = await GossipSubscription.find({ ownerId })
            .populate('agentId', 'name agentType status')
            .sort({ createdAt: -1 })
            .lean();
        return reply.send(subs);
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// GET /api/gossip/subscriptions/:agentId
export async function getSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { agentId } = request.params as any;
        const sub = await GossipSubscription.findOne({ agentId, ownerId }).lean();
        if (!sub) return reply.code(404).send({ error: 'No subscription found' });
        return reply.send(sub);
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// POST /api/gossip/subscribe
// Body: { agentId, catalog, interfaces[] }
export async function subscribe(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { agentId, catalog, interfaces = [] } = request.body as any;

        if (!agentId || !catalog) return reply.code(400).send({ error: 'agentId and catalog are required' });
        if (!GOSSIP_CATALOGS[catalog]) return reply.code(400).send({ error: `Unknown catalog: ${catalog}` });

        // Verify agent belongs to this owner
        const agent = await AgentDefinition.findOne({ _id: agentId, ownerId }).select('name').lean();
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        // Validate interfaces belong to the declared catalog
        const validIfaces = GOSSIP_CATALOGS[catalog].interfaces;
        const filtered = (interfaces as string[]).filter(i => validIfaces.includes(i));

        const sub = await GossipSubscription.findOneAndUpdate(
            { agentId },
            { ownerId, catalog, interfaces: filtered, status: 'active' },
            { upsert: true, new: true }
        );

        return reply.code(201).send({ subscription: sub, agent });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}

// DELETE /api/gossip/subscriptions/:agentId
export async function unsubscribe(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { agentId } = request.params as any;
        await GossipSubscription.findOneAndDelete({ agentId, ownerId });
        return reply.send({ success: true });
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// POST /api/gossip/check-compatibility
// Body: { agentIds[], requiredInterfaces[] }
// Returns compatibility map — used by bubble UI for soft warnings
export async function checkCompatibility(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ownerId = await resolveOwner(request);
        const { agentIds = [], requiredInterfaces = [] } = request.body as any;

        const subs = await GossipSubscription.find({ agentId: { $in: agentIds }, ownerId }).lean();
        const subMap = new Map(subs.map(s => [String(s.agentId), s]));

        const result = (agentIds as string[]).map(id => {
            const sub = subMap.get(id);
            if (!sub) return { agentId: id, subscribed: false, compatible: false, warning: 'Not subscribed to gossip layer' };
            const compatible = interfacesCompatible(sub.interfaces, requiredInterfaces);
            return {
                agentId: id,
                subscribed: true,
                catalog: sub.catalog,
                interfaces: sub.interfaces,
                compatible,
                warning: compatible ? null : `Interface mismatch — agent exposes [${sub.interfaces.join(', ')}]`,
            };
        });

        return reply.send(result);
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}
