import { z } from "zod";
import { BlockchainTool } from "../index";

export const AnchorDataSchema = z.object({
    data_hex: z.string().startsWith("0x", "Must be hex string starting with 0x"),
    lock_script_args: z.string().startsWith("0x"), // The owner
});

export type AnchorDataInput = z.infer<typeof AnchorDataSchema>;

/**
 * Tool: blockchain.ckb.anchoring.anchor_data
 * Description: Generates an output cell containing the provided data to anchor state on-chain.
 */
export const AnchorDataTool: BlockchainTool<AnchorDataInput, any> = {
    name: "blockchain.ckb.anchoring.anchor_data",
    description: "Formats an output cell to anchor a specific hex data blob on the CKB blockchain. Used for saving Omniflow states/run receipts.",
    schema: AnchorDataSchema,
    uiSchema: {
        state_blob: { type: 'string', label: 'Data Blob (Hex/String)', placeholder: '{"status": "ok"}' },
        private_key: { type: 'string', label: 'Private Key', placeholder: '0x...' }
    },
    async execute(input) {
        // Determine minimum capacity based on data size (1 byte = 1 CKB = 10^8 shannons)
        const dataBytes = (input.data_hex.length - 2) / 2;
        // 61 bytes base (lock script (32 hash + 1 type + args) + capacity (8 bytes))
        const requiredCapacityBytes = 61 + (input.lock_script_args.length - 2) / 2 + dataBytes;
        const requiredShannons = requiredCapacityBytes * 100000000;

        return {
            capacity: `0x${requiredShannons.toString(16)}`,
            lock: {
                code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", // Default secp256k1 blake160
                hash_type: "type",
                args: input.lock_script_args,
            },
            data: input.data_hex,
        };
    },
};

export const anchoringTools = [
    AnchorDataTool,
];
