import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";

/**
 * blockchain.ckb_fiber.node_admin.list_peers
 * Use this after connect_peer to get the remote peer's pubkey (needed for open_channel).
 */
export const ListPeersTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb_fiber.node_admin.list_peers",
    description: "List all connected Fiber peers. Use this after connect_peer to retrieve the remote peer's pubkey for open_channel.",
    schema: z.object({}),
    async execute(_input) {
        return await fiberRpcCall("list_peers", []);
    },
};
