import { BlockchainTool } from "../../types";
import { GetCapacityByLockInput, GetCapacityByLockSchema } from "./ckb_contracts_tool";

const NODE_URL = process.env.CKB_NODE_URL || "http://localhost:8114";

async function rpcCall(method: string, params: any[]) {
    const res = await fetch(NODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method,
            params,
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
}

/**
 * Tool: blockchain.ckb.indexer.get_capacity_by_lock
 * Description: Get total capacity for a lock script.
 */
export const GetCapacityByLockTool: BlockchainTool<GetCapacityByLockInput, any> = {
    name: "blockchain.ckb.indexer.get_capacity_by_lock",
    description: "Queries the CKB Indexer for the total CKB capacity belonging to a specific lock script.",
    schema: GetCapacityByLockSchema,
    uiSchema: {
        code_hash: { type: 'string', label: 'Code Hash', placeholder: '0x...' },
        hash_type: { type: 'select', label: 'Hash Type', options: ['type', 'data', 'data1', 'data2'] },
        args: { type: 'string', label: 'Args', placeholder: '0x...' }
    },
    async execute(input) {
        const searchKey = {
            script: {
                code_hash: input.code_hash,
                hash_type: input.hash_type,
                args: input.args,
            },
            script_type: "lock",
        };
        return await rpcCall("get_cells_capacity", [searchKey]);
    },
};
