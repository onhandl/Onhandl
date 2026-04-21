import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";

/**
 * blockchain.ckb_fiber.node_admin.node_info
 * Returns node pubkey, listen addresses, peer count, etc.
 */
export const GetNodeInfoTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.node_info",
    description: "Fetches info about the connected Fiber node: pubkey, listen addresses, peer count, and network alias.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("node_info", []);
    },
};
