import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { ListChannelsSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.channel.list_channels
 */
export const ListChannelsTool: BlockchainTool<z.infer<typeof ListChannelsSchema>, any> = {
    name: "blockchain.ckb_fiber.channel.list_channels",
    description: "List Fiber payment channels. Poll this after open_channel — wait for state_name = 'CHANNEL_READY' before sending payments. Optionally filter by peer_id or pubkey.",
    schema: ListChannelsSchema,
    uiSchema: {
        peer_id: {
            type: "string",
            label: "Filter by Peer ID (optional)",
            placeholder: "QmXen3eUHhywmutEzydCsW4hXBoeVmdET2FJvMX69XJ1Eo",
        },
        include_closed: {
            type: "boolean",
            label: "Include closed channels",
        },
    },
    async execute(input) {
        const params: Record<string, any> = {};
        if (input?.peer_id) params.peer_id = input.peer_id;
        if (input?.pubkey) params.pubkey = input.pubkey;
        if (input?.include_closed) params.include_closed = true;
        return await fiberRpcCall("list_channels", [params]);
    },
};
