import { z } from "zod";
import { BlockchainTool } from "../types";

// Simplified schemas for Transaction Building
const OutPointSchema = z.object({
    tx_hash: z.string(),
    index: z.string(), // Hex string
});

const CellInputSchema = z.object({
    since: z.string().optional(),
    previous_output: OutPointSchema,
});

const ScriptSchema = z.object({
    code_hash: z.string(),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string(),
});

const CellOutputSchema = z.object({
    capacity: z.string(), // Hex string shannons
    lock: ScriptSchema,
    type: ScriptSchema.optional(),
});

const BuildTransferTxSchema = z.object({
    from_address: z.string().startsWith("ckt"),
    to_address: z.string().startsWith("ckt"),
    amount_shannons: z.string(),
    private_key: z.string().startsWith("0x"),
    inputs: z.array(CellInputSchema).optional(),
    outputs: z.array(CellOutputSchema).optional(),
    outputs_data: z.array(z.string().startsWith("0x")).optional(),
});

type BuildTransferTxInput = z.infer<typeof BuildTransferTxSchema>;

/**
 * Tool: blockchain.ckb.tx_builder.build_transfer_tx
 * Description: Deterministically constructs a raw CKB transaction.
 */
const BuildTransferTxTool: BlockchainTool<BuildTransferTxInput, any> = {
    name: "blockchain.ckb.tx_builder.build_transfer_tx",
    description: "Constructs a raw CKB transaction deterministically from inputs, outputs, and outputs_data. Does NOT broadcast.",
    schema: BuildTransferTxSchema,
    uiSchema: {
        from_address: { type: 'string', label: 'Sender Address (Testnet)', placeholder: 'ckt1...' },
        to_address: { type: 'string', label: 'Recipient Address (Testnet)', placeholder: 'ckt1...' },
        amount_shannons: { type: 'string', label: 'Amount (Shannons)', placeholder: '10000000000' },
        private_key: { type: 'string', label: 'Private Key', placeholder: '0x...' }
    },
    async execute(input) {
        // In a real scenario, this would compute the tx hash and format it strictly.
        // For now, it returns the structured raw object representing the skeleton.
        return {
            version: "0x0",
            cell_deps: [], // Typically need secp256k1 deps, added by wallet higher up.
            header_deps: [],
            inputs: input.inputs || [],
            outputs: input.outputs || [],
            outputs_data: input.outputs_data || [],
            witnesses: (input.inputs || []).map(() => "0x"), // Placeholder witnesses
        };
    },
};

export const txBuilderTools = [
    BuildTransferTxTool,
];
