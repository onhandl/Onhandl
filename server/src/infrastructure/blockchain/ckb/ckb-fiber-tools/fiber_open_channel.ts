import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { OpenChannelInput, OpenChannelSchema } from "./fiber_contracts";

/**
 * Convert a user-supplied amount to the hex-shannon string the Fiber RPC requires.
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

/**
 * blockchain.ckb_fiber.channel.open_channel
 */
export const OpenChannelTool: BlockchainTool<OpenChannelInput, any> = {
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
