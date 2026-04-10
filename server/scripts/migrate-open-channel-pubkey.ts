/**
 * Migration: rename `peer_id` → `pubkey` in open_channel blockchain tool nodes.
 *
 * Run once after deploying the open_channel schema fix:
 *   npx tsx server/scripts/migrate-open-channel-pubkey.ts
 */

import mongoose from 'mongoose';
import { AgentDefinition } from '../models/AgentDefinition';
import { AgentNode } from '../models/AgentNode';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onhandl';
const TOOL_NAME = 'blockchain.ckb_fiber.channel.open_channel';

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('[migrate] Connected to MongoDB');

    // ── 1. Patch AgentNode documents ─────────────────────────────────────────
    const nodes = await AgentNode.find({ tool: TOOL_NAME });
    let nodeCount = 0;
    for (const node of nodes) {
        const data = node.data as any;
        const inputs: any[] = data?.inputs ?? [];
        const idx = inputs.findIndex((i: any) => i.key === 'peer_id');
        if (idx === -1) continue;

        inputs[idx] = {
            ...inputs[idx],
            key: 'pubkey',
            label: 'Peer Pubkey (hex from list_peers)',
            placeholder: '0313dcf9cf18711b1b473a78ea56222dc44dcbfdf559d24dd937a0657d3bcb108f',
            value: '',
        };
        node.data = { ...data, inputs };
        node.markModified('data');
        await node.save();
        nodeCount++;
    }
    console.log(`[migrate] Patched ${nodeCount} AgentNode document(s)`);

    // ── 2. Patch AgentDefinition.graph.nodes (embedded canvas state) ─────────
    const agents = await AgentDefinition.find({ 'graph.nodes': { $exists: true } });
    let agentCount = 0;
    for (const agent of agents) {
        const graphNodes: any[] = agent.graph?.nodes ?? [];
        let changed = false;
        for (const n of graphNodes) {
            if (n.data?.tool !== TOOL_NAME) continue;
            const inputs: any[] = n.data?.inputs ?? [];
            const idx = inputs.findIndex((i: any) => i.key === 'peer_id');
            if (idx === -1) continue;
            inputs[idx] = {
                ...inputs[idx],
                key: 'pubkey',
                label: 'Peer Pubkey (hex from list_peers)',
                placeholder: '0313dcf9cf18711b1b473a78ea56222dc44dcbfdf559d24dd937a0657d3bcb108f',
                value: '',
            };
            changed = true;
        }
        if (!changed) continue;
        agent.markModified('graph');
        await agent.save();
        agentCount++;
    }
    console.log(`[migrate] Patched ${agentCount} AgentDefinition graph(s)`);

    await mongoose.disconnect();
    console.log('[migrate] Done');
}

main().catch(err => { console.error(err); process.exit(1); });
