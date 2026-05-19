import { z } from "zod";
import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { FindTransactionsInput, FindTransactionsSchema } from "./ckb_contracts_tool";

/**
 * Tool: blockchain.ckb.indexer.find_transactions
 * Description: Find transactions associated with a CKB address using the CCC indexer.
 */
export const FindTransactionsTool: BlockchainTool<FindTransactionsInput, any> = {
    name: "blockchain.ckb.indexer.find_transactions",
    description: "Queries the CKB indexer for all transactions associated with a given CKB address. Returns both incoming and outgoing transactions with their details.",
    schema: FindTransactionsSchema,
    uiSchema: {
        address: { type: "string", label: "CKB Address", placeholder: "ckt1q..." },
        order: { type: "select", label: "Sort Order", options: ["asc", "desc"] },
        limit: { type: "number", label: "Limit", placeholder: "50" },
    },
    async execute(input) {
        const { script: lockScript } = await ccc.Address.fromString(input.address, cccClient);

        const results: any[] = [];
        for await (const txRecord of cccClient.findTransactionsByLock(
            lockScript,
            undefined,
            false,
            input.order ?? "desc",
            input.limit ?? 50
        )) {
            results.push({
                txHash: txRecord.txHash,
                blockNumber: txRecord.blockNumber?.toString() ?? null,
                ioType: txRecord.ioType,
                ioIndex: txRecord.ioIndex?.toString() ?? null,
            });
        }

        return {
            address: input.address,
            count: results.length,
            transactions: results,
        };
    },
};
