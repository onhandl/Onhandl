import { z } from "zod";
import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { GetAllTransactionsInput, GetAllTransactionsSchema } from "./ckb_contracts_tool";

async function scriptToAddress(script: any): Promise<string | undefined> {
    try {
        const address = ccc.Address.fromScript(script, cccClient);
        return address.toString();
    } catch {
        return undefined;
    }
}

async function parseIncomingTransaction(
    txHash: string,
    outputIndex: any,
    blockNumber: any
): Promise<any | null> {
    try {
        const txResponse = await cccClient.getTransaction(txHash);
        if (!txResponse) return null;

        const tx = txResponse.transaction;
        const outputIdx = Number(outputIndex);
        const output = tx.outputs[outputIdx];
        if (!output) return null;

        const amount = ccc.numFrom(output.capacity);

        let fromAddress: string | undefined;
        if (tx.inputs.length > 0) {
            try {
                const firstInputTx = await cccClient.getTransaction(
                    tx.inputs[0].previousOutput.txHash
                );
                if (firstInputTx) {
                    const senderOutput =
                        firstInputTx.transaction.outputs[
                        Number(tx.inputs[0].previousOutput.index)
                        ];
                    if (senderOutput) {
                        fromAddress = await scriptToAddress(senderOutput.lock);
                    }
                }
            } catch {
                // sender unknown — continue without it
            }
        }

        return {
            txHash,
            blockNumber: blockNumber?.toString() ?? null,
            amountCkb: ccc.fixedPointToString(amount),
            fromAddress: fromAddress ?? null,
            status: txResponse.status,
        };
    } catch (error) {
        console.error(`Error parsing transaction ${txHash}:`, error);
        return null;
    }
}

/**
 * Tool: blockchain.ckb.indexer.get_all_transactions
 * Description: Retrieve all historical incoming transactions for a CKB wallet address.
 */
export const GetAllTransactionsTool: BlockchainTool<GetAllTransactionsInput, any> = {
    name: "blockchain.ckb.indexer.get_all_transactions",
    description: "Retrieves all historical incoming transactions for a given CKB address. Returns enriched records including amount in CKB, sender address, and transaction status.",
    schema: GetAllTransactionsSchema,
    uiSchema: {
        address: { type: "string", label: "CKB Address", placeholder: "ckt1q..." },
    },
    async execute(input) {
        const { script: lockScript } = await ccc.Address.fromString(input.address, cccClient);

        const transactions: any[] = [];
        for await (const txRecord of cccClient.findTransactionsByLock(
            lockScript,
            undefined,
            false,
            "desc",
            100
        )) {
            if (txRecord.ioType === "output") {
                const parsed = await parseIncomingTransaction(
                    txRecord.txHash,
                    txRecord.ioIndex,
                    txRecord.blockNumber
                );
                if (parsed) {
                    transactions.push({ ...parsed, toAddress: input.address });
                }
            }
        }

        return {
            address: input.address,
            count: transactions.length,
            transactions,
        };
    },
};
