import { z } from "zod";

export type GetTransactionInput = z.infer<typeof GetTransactionSchema>;
export type GetBlockInput = z.infer<typeof GetBlockSchema>;
export type GetCapacityByLockInput = z.infer<typeof GetCapacityByLockSchema>;
export type GetLiveCellsByLockInput = z.infer<typeof GetLiveCellsByLockSchema>;
export type BuildTransferTxInput = z.infer<typeof BuildTransferTxSchema>;
export type CreateSignatureInput = z.infer<typeof CreateSignatureSchema>;
export type VerifySignatureInput = z.infer<typeof VerifySignatureSchema>;
export type GetAddressInput = z.infer<typeof GetAddressSchema>;
export type GenerateWalletInput = z.infer<typeof GenerateWalletSchema>;


export const OutPointSchema = z.object({
    tx_hash: z.string(),
    index: z.string(), // Hex string
});

export const CellInputSchema = z.object({
    since: z.string().optional(),
    previous_output: OutPointSchema,
});

export const ScriptSchema = z.object({
    code_hash: z.string(),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string(),
});

export const CellOutputSchema = z.object({
    capacity: z.string(), // Hex string shannons
    lock: ScriptSchema,
    type: ScriptSchema.optional(),
});


export const BuildTransferTxSchema = z.object({
    from_address: z.string().startsWith("ckt"),
    to_address: z.string().startsWith("ckt"),
    amount_shannons: z.string(),
    private_key: z.string().startsWith("0x"),
    inputs: z.array(CellInputSchema).optional(),
    outputs: z.array(CellOutputSchema).optional(),
    outputs_data: z.array(z.string().startsWith("0x")).optional(),
});


export const GetLiveCellsByLockSchema = z.object({
    code_hash: z.string().startsWith("0x"),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string().startsWith("0x"),
    limit: z.number().optional().describe("Defaults to 10"),
});


export const GetBalanceSchema = z.object({
    address: z.string().describe("The CKB address to check the balance for"),
});

export const GetCapacityByLockSchema = z.object({
    code_hash: z.string().startsWith("0x"),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string().startsWith("0x"),
});


export const TransferSchema = z.object({
    from: z.string().describe("The sender's CKB address"),
    to: z.string().describe("The recipient's CKB address"),
    amount: z.number().describe("The amount of CKB to transfer (e.g. 100)"),
    privateKey: z.string().describe("The private key of the sender")
});

export const GetTransactionSchema = z.object({
    tx_hash: z.string().startsWith("0x").length(66, "Transaction hash must be a 32-byte hex string starting with 0x"),
});

export const GetBlockSchema = z.object({
    block_hash: z.string().startsWith("0x").length(66, "Block hash must be a 32-byte hex string starting with 0x"),
});

export const CreateSignatureSchema = z.object({
    message: z.string().describe("The plain text message to sign"),
    privateKey: z.string().describe("The hex private key to sign with (with 0x prefix)")
});

export const VerifySignatureSchema = z.object({
    message: z.string().describe("The original plain text message"),
    signatureJson: z.string().describe("The JSON-encoded signature"),
    expectedAddress: z.string().describe("The CKB address expected to have signed the message")
});

export const GetAddressSchema = z.object({
    privateKey: z.string().describe("The hex private key to derive the address from")
});

export const GenerateWalletSchema = z.object({}).describe("Generates a new CKB wallet (private key and address)");

export const ckbContractsTools = [];
