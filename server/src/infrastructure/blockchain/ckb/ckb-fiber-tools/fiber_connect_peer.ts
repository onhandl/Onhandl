import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { ConnectPeerSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.node_admin.connect_peer
 * MUST be called before open_channel. Establishes the P2P connection to a remote peer.
 * address format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}
 */
export const ConnectPeerTool: BlockchainTool<z.infer<typeof ConnectPeerSchema>, any> = {
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
