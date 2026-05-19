import { BlockchainTool } from "../../types";
import RPC from "@nervosnetwork/ckb-sdk-core";
import { GetBlockInput, GetBlockSchema } from "./ckb_contracts_tool";

const NODE_URL = process.env.CKB_NODE_URL || "http://localhost:8114";
const rpc = new RPC(NODE_URL);

/**
 * Tool: blockchain.ckb.rpc.get_block
 * Description: Get a block by its hash.
 */
export const GetBlockTool: BlockchainTool<GetBlockInput, any> = {
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
