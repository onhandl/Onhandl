import { z } from "zod";
import { BlockchainTool } from "../../index";

const FIBER_URL = process.env.FIBER_NODE_URL || "http://localhost:8227";
const FIBER_AUTH_TOKEN = process.env.FIBER_AUTH_TOKEN || "";

export async function fiberRpcCall(method: string, params: any[]) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (FIBER_AUTH_TOKEN) {
        headers["Authorization"] = `Bearer ${FIBER_AUTH_TOKEN}`;
    }

    const body = JSON.stringify({ id: 1, jsonrpc: "2.0", method, params });
    console.debug(`[Fiber RPC] → ${FIBER_URL} | ${method} | body: ${body}`);

    const res = await fetch(FIBER_URL, { method: "POST", headers, body });
    const data = await res.json();
    console.debug(`[Fiber RPC] ← ${method} | response: ${JSON.stringify(data)}`);
    if (data.error) throw new Error(`Fiber RPC error (${method}): ${JSON.stringify(data.error)}`);
    return data.result;
}

/**
 * blockchain.ckb_fiber.node_admin.node_info
 * Returns node pubkey, listen addresses, peer count, etc.
 */
const GetNodeInfoTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.node_info",
    description: "Fetches info about the connected Fiber node: pubkey, listen addresses, peer count, and network alias.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("node_info", []);
    },
};

/**
 * blockchain.ckb_fiber.node_admin.connect_peer
 * MUST be called before open_channel. Establishes the P2P connection to a remote peer.
 * address format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}
 * Example: /ip4/18.162.235.225/tcp/8119/p2p/QmXen3eUHhywmutEzydCsW4hXBoeVmdET2FJvMX69XJ1Eo
 */
const ConnectPeerSchema = z.object({
    address: z.string().min(1, "Multiaddr is required. Format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}"),
    save: z.boolean().optional(),
});

const ConnectPeerTool: BlockchainTool<z.infer<typeof ConnectPeerSchema>, any> = {
    name: "blockchain.ckb_fiber.node_admin.connect_peer",
    description: "Connect to a remote Fiber peer. REQUIRED before open_channel. Address format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}. Returns null on success.",
    schema: ConnectPeerSchema,
    uiSchema: {
        address: {
            type: "string",
            label: "Peer Multiaddr",
            placeholder: "/ip4/18.162.235.225/tcp/8119/p2p/QmXen3eUHhywmutEzydCsW4hXBoeVmdET2FJvMX69XJ1Eo",
        },
        save: {
            type: "boolean",
            label: "Save peer to disk",
        },
    },
    async execute(input) {
        // Strip any whitespace the user may have accidentally pasted into the multiaddr
        const cleanAddress = input.address.replace(/\s+/g, '');
        const params: any = { address: cleanAddress };
        if (input.save) params.save = true;
        // Returns null on success — wrap so downstream nodes get something useful
        const result = await fiberRpcCall("connect_peer", [params]);
        return { connected: true, address: input.address, raw: result };
    },
};

/**
 * blockchain.ckb_fiber.node_admin.disconnect_peer
 */
const DisconnectPeerSchema = z.object({
    peer_id: z.string().min(1, "Peer ID required (Qm... format)"),
});

const DisconnectPeerTool: BlockchainTool<z.infer<typeof DisconnectPeerSchema>, any> = {
    name: "blockchain.ckb_fiber.node_admin.disconnect_peer",
    description: "Disconnect from a currently connected Fiber peer.",
    schema: DisconnectPeerSchema,
    uiSchema: {
        peer_id: { type: "string", label: "Peer ID", placeholder: "QmXen3eUHhywmutEzydCsW4hXBoeVmdET2FJvMX69XJ1Eo" },
    },
    async execute(input) {
        await fiberRpcCall("disconnect_peer", [{ peer_id: input.peer_id }]);
        return { disconnected: true, peer_id: input.peer_id };
    },
};

/**
 * blockchain.ckb_fiber.node_admin.list_peers
 * Use this after connect_peer to get the remote peer's pubkey (needed for open_channel).
 */
const ListPeersTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.list_peers",
    description: "List all connected Fiber peers. Use this after connect_peer to retrieve the remote peer's pubkey for open_channel.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("list_peers", []);
    },
};

/**
 * blockchain.ckb_fiber.node_admin.network_status
 */
const NetworkStatusTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.network_status",
    description: "Checks the Fiber network graph — how many nodes and channels are visible.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("graph_nodes", [{ limit: "0x10" }]);
    },
};

export const nodeAdminTools = [
    GetNodeInfoTool,
    ConnectPeerTool,
    DisconnectPeerTool,
    ListPeersTool,
    NetworkStatusTool,
];
