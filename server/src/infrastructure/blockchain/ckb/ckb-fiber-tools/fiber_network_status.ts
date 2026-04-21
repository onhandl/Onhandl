import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";

/**
 * blockchain.ckb_fiber.node_admin.network_status
 */
export const NetworkStatusTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.network_status",
    description: "Checks the Fiber network graph — how many nodes and channels are visible.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("graph_nodes", [{ limit: "0x10" }]);
    },
};
