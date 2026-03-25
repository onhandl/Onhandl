import { z } from "zod";
import { BlockchainTool } from "../../index";

// Standard function to call a Fiber Node RPC
const FIBER_URL = process.env.FIBER_NODE_URL || "http://localhost:8227";
const FIBER_AUTH_TOKEN = process.env.FIBER_AUTH_TOKEN || "";

async function fiberRpcCall(method: string, params: any[]) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (FIBER_AUTH_TOKEN) {
        headers["Authorization"] = `Bearer ${FIBER_AUTH_TOKEN}`;
    }

    const res = await fetch(FIBER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method,
            params,
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
}

/**
 * Tool: blockchain.ckb_fiber.node_admin.node_info
 * Description: Get node information.
 */
export const GetNodeInfoTool: BlockchainTool<void, any> = {
    name: "blockchain.ckb_fiber.node_admin.node_info",
    description: "Fetches information about the connected Fiber node, including its public key, network bound addresses, and aliases.",
    schema: z.void(),
    async execute() {
        return await fiberRpcCall("node_info", []);
    },
};

/**
 * Tool: blockchain.ckb_fiber.node_admin.network_status
 * Description: Get network synchronization status.
 */
export const NetworkStatusTool: BlockchainTool<void, any> = {
    name: "blockchain.ckb_fiber.node_admin.network_status",
    description: "Checks if the Fiber node has correctly synced its graph routing with the network peers.",
    schema: z.void(),
    async execute() {
        // Info module method for local routing graph info
        return await fiberRpcCall("graph_nodes", [{ limit: "0x10" }]);
    },
};

export const nodeAdminTools = [
    GetNodeInfoTool,
    NetworkStatusTool,
];

// Provide an internal helper export so other fiber modules can use the RPC caller
export { fiberRpcCall };
