import { z } from "zod";
import { BlockchainTool } from "../types";
import RPC from "@nervosnetwork/ckb-sdk-core";

// Define a default node URL, ideally from ENV vars in the future
const NODE_URL = process.env.CKB_NODE_URL || "http://localhost:8114";
const rpc = new RPC(NODE_URL);

/**
 * Tool: blockchain.ckb.rpc.get_tip_header
 * Description: Get the tip (latest) header of the CKB chain.
 */
const GetTipHeaderTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb.rpc.get_tip_header",
    description: "Fetches the highest block header in the CKB node's current chain.",
    schema: z.object({}),
    async execute(_input) {
        return await rpc.rpc.getTipHeader();
    },
};

/**
 * Input Schema for GetTransaction
 */
const GetTransactionSchema = z.object({
    tx_hash: z.string().startsWith("0x").length(66, "Transaction hash must be a 32-byte hex string starting with 0x"),
});

type GetTransactionInput = z.infer<typeof GetTransactionSchema>;

/**
 * Tool: blockchain.ckb.rpc.get_transaction
 * Description: Get a transaction by its hash.
 */
const GetTransactionTool: BlockchainTool<GetTransactionInput, any> = {
    name: "blockchain.ckb.rpc.get_transaction",
    description: "Fetches a transaction and its status given its 32-byte transaction hash.",
    schema: GetTransactionSchema,
    uiSchema: {
        tx_hash: { type: 'string', label: 'Transaction Hash', placeholder: '0x...' }
    },
    async execute(input) {
        return await rpc.rpc.getTransaction(input.tx_hash);
    },
};

/**
 * Input Schema for GetBlock
 */
const GetBlockSchema = z.object({
    block_hash: z.string().startsWith("0x").length(66, "Block hash must be a 32-byte hex string starting with 0x"),
});

type GetBlockInput = z.infer<typeof GetBlockSchema>;

/**
 * Tool: blockchain.ckb.rpc.get_block
 * Description: Get a block by its hash.
 */
const GetBlockTool: BlockchainTool<GetBlockInput, any> = {
    name: "blockchain.ckb.rpc.get_block",
    description: "Fetches a full block by its 32-byte block hash.",
    schema: GetBlockSchema,
    uiSchema: {
        block_hash: { type: 'string', label: 'Block Hash', placeholder: '0x...' }
    },
    async execute(input) {
        return await rpc.rpc.getBlock(input.block_hash);
    },
};

// Export all RPC tools
export const rpcTools = [
    GetTipHeaderTool,
    GetTransactionTool,
    GetBlockTool,
];
