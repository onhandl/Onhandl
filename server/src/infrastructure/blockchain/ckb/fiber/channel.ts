import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./node_admin";

/**
 * Convert a user-supplied amount to the hex-shannon string the Fiber RPC requires.
 *
 * Accepts two formats:
 *   "500"          → treated as CKB → 500 × 100_000_000 = 50_000_000_000 shannons → "0xba43b7400"
 *   "0xba43b7400"  → already hex shannons, passed through unchanged
 *
 * Minimum accepted: 62 CKB (6_200_000_000 shannons) — Fiber's minimum channel size.
 */
function toCkbHexShannons(amount: string): string {
    const raw = String(amount).trim();
    // Already hex shannons — pass through unchanged
    if (/^0x[0-9a-fA-F]+$/.test(raw)) return raw;
    // Integer CKB value → pure BigInt math (no float rounding errors)
    if (/^\d+$/.test(raw)) {
        const shannons = BigInt(raw) * 100_000_000n;
        return "0x" + shannons.toString(16);
    }
    throw new Error(`Invalid funding amount: "${amount}". Provide integer CKB (e.g. "500") or hex shannons (e.g. "0xba43b7400"). Min ~62 CKB.`);
}

// ─── open_channel ──────────────────────────────────────────────────────────────
// Fiber RPC: open_channel({ peer_id, funding_amount, public })
// peer_id: the Qm... ID from connect_peer / list_peers
// funding_amount: hex shannons ("0xba43b7400" = 500 CKB). Min ~62 CKB.

const OpenChannelSchema = z.object({
    pubkey: z.string().min(1, "Peer pubkey is required (hex from list_peers → pubkey field)"),
    funding_amount: z.string().min(1, "Funding amount required. Enter CKB (e.g. '500') or hex shannons (e.g. '0xba43b7400'). Min ~62 CKB."),
    public: z.boolean().optional(),
});

type OpenChannelInput = z.infer<typeof OpenChannelSchema>;

const OpenChannelTool: BlockchainTool<OpenChannelInput, any> = {
    name: "blockchain.ckb_fiber.channel.open_channel",
    description: "Open a Fiber payment channel. Run connect_peer then list_peers first — use the 'pubkey' field from list_peers (hex). funding_amount: CKB decimal ('500') or hex shannons ('0xba43b7400'). Min ~62 CKB.",
    schema: OpenChannelSchema,
    uiSchema: {
        pubkey: {
            type: "string",
            label: "Peer Pubkey (hex from list_peers)",
            placeholder: "0313dcf9cf18711b1b473a78ea56222dc44dcbfdf559d24dd937a0657d3bcb108f",
        },
        funding_amount: {
            type: "string",
            label: "Funding Amount",
            placeholder: "500  (CKB)  or  0xba43b7400  (hex shannons)",
        },
        public: {
            type: "boolean",
            label: "Public Channel",
        },
    },
    async execute(input) {
        const result = await fiberRpcCall("open_channel", [{
            pubkey: input.pubkey.trim(),
            funding_amount: toCkbHexShannons(input.funding_amount),
            public: input.public ?? true,
        }]);
        // Returns { temporary_channel_id: "0x..." }
        return result;
    },
};

// ─── list_channels ─────────────────────────────────────────────────────────────

const ListChannelsSchema = z.object({
    peer_id: z.string().optional().describe("Filter by peer ID (Qm... format)"),
    pubkey: z.string().optional().describe("Filter by peer pubkey (hex)"),
    include_closed: z.boolean().optional().describe("Include closed channels"),
}).optional();

const ListChannelsTool: BlockchainTool<z.infer<typeof ListChannelsSchema>, any> = {
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

// ─── shutdown_channel (cooperative close) ──────────────────────────────────────
// Uses the shutdown_channel RPC which requires close_script + fee_rate.
// For the secp256k1 lock (standard CKB address), use the standard code_hash.

const ShutdownChannelSchema = z.object({
    channel_id: z.string().describe("32-byte hex channel ID from list_channels"),
    close_address_args: z.string().describe("20-byte CKB lock arg (your address args). Found in your wallet address."),
    fee_rate: z.string().optional().describe("Shannons per KB, hex. Default 0x3FC = 1020 s/KB"),
});

type ShutdownChannelInput = z.infer<typeof ShutdownChannelSchema>;

const ShutdownChannelTool: BlockchainTool<ShutdownChannelInput, any> = {
    name: "blockchain.ckb_fiber.channel.shutdown_channel",
    description: "Cooperatively close a Fiber channel. Sends shutdown_channel RPC with a secp256k1 close_script. The channel must be in CHANNEL_READY state.",
    schema: ShutdownChannelSchema,
    uiSchema: {
        channel_id: {
            type: "string",
            label: "Channel ID",
            placeholder: "0xcc0b319e3b1155196a4ffc6c2f71205...",
        },
        close_address_args: {
            type: "string",
            label: "CKB Lock Args (20-byte hex)",
            placeholder: "0x4d4ae843f62f05bf1ac601b3dbd43b5b4f9a006a",
        },
        fee_rate: {
            type: "string",
            label: "Fee Rate (hex shannons/KB)",
            placeholder: "0x3FC",
        },
    },
    async execute(input) {
        return await fiberRpcCall("shutdown_channel", [{
            channel_id: input.channel_id,
            close_script: {
                // Standard secp256k1 single-sig lock (mainnet + testnet share this code_hash)
                code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                hash_type: "type",
                args: input.close_address_args,
            },
            fee_rate: input.fee_rate ?? "0x3FC",
        }]);
    },
};

// ─── abandon_channel (emergency — non-ready stuck channels) ────────────────────

const AbandonChannelSchema = z.object({
    channel_id: z.string().describe("32-byte hex channel ID to abandon"),
});

const AbandonChannelTool: BlockchainTool<z.infer<typeof AbandonChannelSchema>, any> = {
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

export const channelTools = [
    OpenChannelTool,
    ListChannelsTool,
    ShutdownChannelTool,
    AbandonChannelTool,
];
