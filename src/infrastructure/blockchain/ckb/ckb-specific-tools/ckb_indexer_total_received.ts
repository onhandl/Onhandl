import { z } from "zod";
import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { GetTotalReceivedInput, GetTotalReceivedSchema } from "./ckb_contracts_tool";

/**
 * Tool: blockchain.ckb.indexer.get_total_received
 * Description: Calculate the total CKB received by a wallet address (sum of all incoming output capacities).
 */
export const GetTotalReceivedTool: BlockchainTool<GetTotalReceivedInput, any> = {
    name: "blockchain.ckb.indexer.get_total_received",
    description: "Calculates the total amount of CKB ever received by a given address by summing all incoming transaction outputs tracked by the CKB indexer. Returns the total in CKB.",
    schema: GetTotalReceivedSchema,
    uiSchema: {
        address: { type: "string", label: "CKB Address", placeholder: "ckt1q..." },
    },
    async execute(input) {
        const { script: lockScript } = await ccc.Address.fromString(input.address, cccClient);

        let totalShannons = ccc.numFrom(0);
        let txCount = 0;

        for await (const txRecord of cccClient.findTransactionsByLock(
            lockScript,
            undefined,
            false,
            "asc",
            200
        )) {
            if (txRecord.ioType !== "output") continue;

            try {
                const txResponse = await cccClient.getTransaction(txRecord.txHash);
                if (!txResponse) continue;

                const output = txResponse.transaction.outputs[Number(txRecord.ioIndex)];
                if (!output) continue;

                totalShannons = totalShannons + ccc.numFrom(output.capacity);
                txCount++;
            } catch {
                // skip unresolvable transactions
            }
        }

        return {
            address: input.address,
            totalCkb: ccc.fixedPointToString(totalShannons),
            incomingTransactionCount: txCount,
        };
    },
};
