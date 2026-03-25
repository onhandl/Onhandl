import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./node_admin";

export const OpenChannelSchema = z.object({
    peer_id: z.string(),
    funding_amount: z.string().describe("Amount of CKB to fund in hex shannons"),
    udt_type_script: z.any().optional(),
});

export type OpenChannelInput = z.infer<typeof OpenChannelSchema>;

export const OpenChannelTool: BlockchainTool<OpenChannelInput, any> = {
    name: "blockchain.ckb_fiber.channel.open_channel",
    description: "Initiates opening a state channel with another Fiber peer, committing funds to a 2-of-2 multisig on CKB layer 1.",
    schema: OpenChannelSchema,
    uiSchema: {
        peer_id: { type: 'string', label: 'Peer ID', placeholder: 'peer_123...' },
        funding_amount: { type: 'string', label: 'Funding Amount (shannons)', placeholder: '10000000000' },
        public: { type: 'boolean', label: 'Public Channel' }
    },
    async execute(input) {
        return await fiberRpcCall("open_channel", [{
            peer_id: input.peer_id,
            funding_amount: input.funding_amount,
            udt_type_script: input.udt_type_script
        }]);
    },
};

export const CloseChannelSchema = z.object({
    channel_id: z.string(),
    force: z.boolean().optional().describe("Defaults to false"),
});

export type CloseChannelInput = z.infer<typeof CloseChannelSchema>;

export const CloseChannelTool: BlockchainTool<CloseChannelInput, any> = {
    name: "blockchain.ckb_fiber.channel.close_channel",
    description: "Closes an existing state channel cooperatively (or uncooperatively if force=true) and settles balances back on L1.",
    schema: CloseChannelSchema,
    uiSchema: {
        channel_id: { type: 'string', label: 'Channel ID', placeholder: '0x...' },
        force: { type: 'boolean', label: 'Force Close' }
    },
    async execute(input) {
        return await fiberRpcCall("close_channel", [{
            channel_id: input.channel_id,
            force: input.force
        }]);
    },
};

export const ListChannelsTool: BlockchainTool<void, any> = {
    name: "blockchain.ckb_fiber.channel.list_channels",
    description: "Lists all locally active payment channels and their current balances.",
    schema: z.void(),
    async execute() {
        return await fiberRpcCall("list_channels", []);
    },
};

export const channelTools = [
    OpenChannelTool,
    CloseChannelTool,
    ListChannelsTool,
];
