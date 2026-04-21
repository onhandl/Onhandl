import { z } from "zod";
import { BlockchainTool } from "../../types";
import RPC from "@nervosnetwork/ckb-sdk-core";

const NODE_URL = process.env.CKB_NODE_URL || "http://localhost:8114";
const rpc = new RPC(NODE_URL);

/**
 * Tool: blockchain.ckb.rpc.get_tip_header
 * Description: Get the tip (latest) header of the CKB chain.
 */
export const GetTipHeaderTool: BlockchainTool<Record<string, never>, any> = {
    name: "blockchain.ckb.rpc.get_tip_header",
    description: "Fetches the highest block header in the CKB node's current chain.",
    schema: z.object({}),
    async execute(_input) {
        return await rpc.rpc.getTipHeader();
    },
};
