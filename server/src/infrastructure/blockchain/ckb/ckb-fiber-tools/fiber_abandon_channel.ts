import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { AbandonChannelSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.channel.abandon_channel
 */
export const AbandonChannelTool: BlockchainTool<z.infer<typeof AbandonChannelSchema>, any> = {
    name: "blockchain.ckb_fiber.channel.abandon_channel",
    description: "Emergency: remove a channel stuck in a non-Ready, non-Closed state. Does NOT settle funds on-chain — only use if cooperative close is impossible.",
    schema: AbandonChannelSchema,
    uiSchema: {
        channel_id: {
            type: "string",
            label: "Channel ID",
            placeholder: "0x...",
        },
    },
    async execute(input) {
        return await fiberRpcCall("abandon_channel", [{ channel_id: input.channel_id }]);
    },
};
