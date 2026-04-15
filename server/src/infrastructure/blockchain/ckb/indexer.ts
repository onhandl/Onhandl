import { z } from "zod";
import { BlockchainTool } from "../types";
import { Indexer } from "@ckb-lumos/lumos"; // or @nervosnetwork/ckb-sdk-core Indexer if supported, let's just use JSON RPC for now

// We will use standard fetch to the CKB indexer for now to keep dependencies light, 
// assuming standard CKB RPC node provides indexer methods (like get_cells)
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
 * Input Schema for GetLiveCellsByLock
 */
const GetLiveCellsByLockSchema = z.object({
    code_hash: z.string().startsWith("0x"),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string().startsWith("0x"),
    limit: z.number().optional().describe("Defaults to 10"),
});

type GetLiveCellsByLockInput = z.infer<typeof GetLiveCellsByLockSchema>;

/**
 * Tool: blockchain.ckb.indexer.get_live_cells_by_lock
 * Description: Get live cells for a specific lock script.
 */
const GetLiveCellsByLockTool: BlockchainTool<GetLiveCellsByLockInput, any> = {
    name: "blockchain.ckb.indexer.get_live_cells_by_lock",
    description: "Queries the CKB Indexer for live cells belonging to a specific lock script. Useful for fetching UTXOs to spend.",
    schema: GetLiveCellsByLockSchema,
    uiSchema: {
        code_hash: { type: 'string', label: 'Code Hash', placeholder: '0x...' },
        hash_type: { type: 'select', label: 'Hash Type', options: ['type', 'data', 'data1', 'data2'] },
        args: { type: 'string', label: 'Args', placeholder: '0x...' },
        limit: { type: 'number', label: 'Limit', placeholder: '10' }
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
        // get_cells is the RPC method provided by ckb-indexer
        return await rpcCall("get_cells", [searchKey, "asc", `0x${(input.limit || 10).toString(16)}`]);
    },
};

/**
 * Input Schema for GetCapacityByLock
 */
const GetCapacityByLockSchema = z.object({
    code_hash: z.string().startsWith("0x"),
    hash_type: z.enum(["type", "data", "data1", "data2"]),
    args: z.string().startsWith("0x"),
});

type GetCapacityByLockInput = z.infer<typeof GetCapacityByLockSchema>;

/**
 * Tool: blockchain.ckb.indexer.get_capacity_by_lock
 * Description: Get total capacity for a lock script.
 */
const GetCapacityByLockTool: BlockchainTool<GetCapacityByLockInput, any> = {
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

export const indexerTools = [
    GetLiveCellsByLockTool,
    GetCapacityByLockTool,
];
