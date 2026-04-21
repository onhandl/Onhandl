import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { DisconnectPeerSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.node_admin.disconnect_peer
 */
export const DisconnectPeerTool: BlockchainTool<z.infer<typeof DisconnectPeerSchema>, any> = {
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
