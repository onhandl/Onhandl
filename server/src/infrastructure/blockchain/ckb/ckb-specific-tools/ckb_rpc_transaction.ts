import { BlockchainTool } from "../../types";
import RPC from "@nervosnetwork/ckb-sdk-core";
import { GetTransactionInput, GetTransactionSchema } from "./ckb_contracts_tool";

const NODE_URL = process.env.CKB_NODE_URL || "http://localhost:8114";
const rpc = new RPC(NODE_URL);

/**
 * Tool: blockchain.ckb.rpc.get_transaction
 * Description: Get a transaction by its hash.
 */
export const GetTransactionTool: BlockchainTool<GetTransactionInput, any> = {
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
