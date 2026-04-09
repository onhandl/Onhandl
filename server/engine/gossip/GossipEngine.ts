import { FastifyReply } from 'fastify';
import { Bubble } from '../../models/Bubble';
import { GossipMessage, GossipType } from '../../models/GossipMessage';
import { AgentDefinition } from '../../models/AgentDefinition';

type SSEClient = { reply: FastifyReply; bubbleId: string };

// Capability sets by agent type
const AGENT_CAPABILITIES: Record<string, string[]> = {
    financial_agent:   ['swap_tokens', 'lend_ETH', 'borrow_USDT', 'check_APY', 'monitor_portfolio'],
    social_agent:      ['send_message', 'post_update', 'fetch_feed', 'notify_user', 'broadcast'],
    operational_agent: ['run_workflow', 'execute_node', 'schedule_task', 'monitor_status', 'trigger_event'],
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildPayload(type: GossipType, agentType: string, taskContext?: string): Record<string, any> {
    const caps = AGENT_CAPABILITIES[agentType] ?? AGENT_CAPABILITIES.operational_agent;
    const now = new Date().toISOString();

    switch (type) {
        case 'capability_announce':
            return { capabilities: shuffle(caps).slice(0, 3), timestamp: now };
        case 'status':
            return { uptime: `${(Math.random() * 100).toFixed(1)}%`, blocksBehind: Math.floor(Math.random() * 3), gasPrice: Math.floor(Math.random() * 80 + 20), timestamp: now };
        case 'offer':
            return { task: shuffle(caps)[0], maxAmount: parseFloat((Math.random() * 10).toFixed(4)), currency: 'ETH', expires: now };
        case 'task_claim':
            return { task: taskContext ?? shuffle(caps)[0], claimedAt: now };
        case 'result_update':
            return { progress: parseFloat((Math.random()).toFixed(2)), detail: { processed: Math.floor(Math.random() * 100) }, timestamp: now };
        case 'task_request':
            return { task: taskContext ?? shuffle(caps)[0], requestedAt: now };
        default:
            return { timestamp: now };
    }
}

class GossipEngine {
    private timers   = new Map<string, ReturnType<typeof setInterval>>();
    private rounds   = new Map<string, number>();
    private clients  = new Map<string, Set<FastifyReply>>();

    // ── SSE client management ─────────────────────────────────────────────────
    addClient(bubbleId: string, reply: FastifyReply) {
        if (!this.clients.has(bubbleId)) this.clients.set(bubbleId, new Set());
        this.clients.get(bubbleId)!.add(reply);
    }

    removeClient(bubbleId: string, reply: FastifyReply) {
        this.clients.get(bubbleId)?.delete(reply);
    }

    // ── Bubble lifecycle ──────────────────────────────────────────────────────
    startBubble(bubbleId: string, agentIds: string[], interval: number, fanout: number) {
        this.stopBubble(bubbleId);
        if (agentIds.length === 0) return;

        const timer = setInterval(() => {
            this.runRound(bubbleId, agentIds, fanout).catch(console.error);
        }, interval * 1000);

        this.timers.set(bubbleId, timer);
        this.rounds.set(bubbleId, 0);
    }

    stopBubble(bubbleId: string) {
        const t = this.timers.get(bubbleId);
        if (t) { clearInterval(t); this.timers.delete(bubbleId); }
    }

    isRunning(bubbleId: string) {
        return this.timers.has(bubbleId);
    }

    // ── Core gossip round ─────────────────────────────────────────────────────
    async runRound(bubbleId: string, agentIds: string[], fanout: number) {
        if (agentIds.length === 0) return;

        const round = (this.rounds.get(bubbleId) ?? 0) + 1;
        this.rounds.set(bubbleId, round);

        // Load a random sender agent
        const senderId = shuffle(agentIds)[0];
        const sender = await AgentDefinition.findById(senderId).select('name agentType').lean();
        if (!sender) return;

        // Pick recipients
        const others    = agentIds.filter(id => id !== String(senderId));
        const recipients = shuffle(others).slice(0, fanout);

        // Pick gossip type (weighted toward capability_announce and status)
        const typeWeights: GossipType[] = [
            'capability_announce', 'capability_announce',
            'status', 'status',
            'offer',
            'task_claim',
            'result_update',
        ];
        const type = typeWeights[Math.floor(Math.random() * typeWeights.length)];

        const payload = buildPayload(type, sender.agentType);

        const msg = await GossipMessage.create({
            bubbleId,
            fromAgentId:    senderId,
            fromAgentName:  sender.name,
            toAgentIds:     recipients,
            type,
            payload,
            round,
            propagationCount: recipients.length || agentIds.length - 1,
        });

        await Bubble.updateOne({ _id: bubbleId }, { $inc: { messageCount: 1 } });

        this.broadcast(bubbleId, msg.toObject());
    }

    // ── Task request — inject a user-triggered gossip event ───────────────────
    async injectTaskRequest(bubbleId: string, agentIds: string[], task: string) {
        if (agentIds.length === 0) return;

        const senderId = shuffle(agentIds)[0];
        const sender   = await AgentDefinition.findById(senderId).select('name agentType').lean();
        if (!sender) return;

        const msg = await GossipMessage.create({
            bubbleId,
            fromAgentId:    senderId,
            fromAgentName:  sender.name,
            toAgentIds:     agentIds.filter(id => id !== String(senderId)),
            type:           'task_request',
            payload:        buildPayload('task_request', sender.agentType, task),
            round:          this.rounds.get(bubbleId) ?? 0,
            propagationCount: agentIds.length - 1,
        });

        await Bubble.updateOne({ _id: bubbleId }, { $inc: { messageCount: 1 } });
        this.broadcast(bubbleId, msg.toObject());

        // Follow up with a task_claim after 1.5s
        setTimeout(async () => {
            const claimerId = shuffle(agentIds.filter(id => id !== String(senderId)))[0];
            if (!claimerId) return;
            const claimer = await AgentDefinition.findById(claimerId).select('name agentType').lean();
            if (!claimer) return;
            const claim = await GossipMessage.create({
                bubbleId,
                fromAgentId:    claimerId,
                fromAgentName:  claimer.name,
                toAgentIds:     [senderId],
                type:           'task_claim',
                payload:        buildPayload('task_claim', claimer.agentType, task),
                round:          this.rounds.get(bubbleId) ?? 0,
                propagationCount: 1,
            });
            await Bubble.updateOne({ _id: bubbleId }, { $inc: { messageCount: 1 } });
            this.broadcast(bubbleId, claim.toObject());
        }, 1500);
    }

    // ── Load active bubbles on server startup ─────────────────────────────────
    async initFromDb() {
        const bubbles = await Bubble.find({ status: 'active' }).lean();
        for (const b of bubbles) {
            const ids = b.agentIds.map(String);
            this.startBubble(String(b._id), ids, b.gossipInterval, b.fanout);
        }
        console.log(`[GossipEngine] Started ${bubbles.length} active bubble(s)`);
    }

    // ── Broadcast to SSE clients ──────────────────────────────────────────────
    private broadcast(bubbleId: string, data: object) {
        const set = this.clients.get(bubbleId);
        if (!set || set.size === 0) return;
        const line = `data: ${JSON.stringify(data)}\n\n`;
        for (const reply of [...set]) {
            try { reply.raw.write(line); } catch { set.delete(reply); }
        }
    }
}

export const gossipEngine = new GossipEngine();
