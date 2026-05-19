import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { MonitorTransactionsInput, MonitorTransactionsSchema } from "./ckb_contracts_tool";

/**
 * Tool: blockchain.ckb.indexer.monitor_transactions
 *
 * Returns the most recent output transactions for the given CKB address.
 * No block-range filtering — duplicate protection is handled upstream by
 * DB-level idempotency (IdempotencyService) in CkbFundsReceivedSource.
 *
 * Mirrors the proven CCC Playground approach:
 *   findTransactionsByLock(script, undefined, false, "desc", limit)
 */
export const MonitorTransactionsTool: BlockchainTool<MonitorTransactionsInput, any> = {
    name: "blockchain.ckb.indexer.monitor_transactions",
    description:
        "Polls the CKB indexer for recent incoming transactions to a wallet address. Returns new incoming transactions and the nextFromBlock to use for the next poll cycle.",
    schema: MonitorTransactionsSchema,
    uiSchema: {
        address: { type: "string", label: "CKB Address", placeholder: "ckt1q..." },
        fromBlock: { type: "string", label: "From Block (hex)", placeholder: "0x0" },
        limit: { type: "number", label: "Limit per poll", placeholder: "50" },
    },
    async execute(input) {
        const { script } = await ccc.Address.fromString(input.address, cccClient);

        const currentBlock = BigInt(await cccClient.getTip());
        const fromBlock = input.fromBlock ? BigInt(input.fromBlock) : currentBlock;

        console.log('[MonitorTransactionsTool] monitoring address', input.address);
        console.log('[MonitorTransactionsTool] tip', currentBlock.toString());

        const newTransactions: any[] = [];
        const seen = new Set<string>();

        for await (const tx of cccClient.findTransactionsByLock(
            script,
            undefined,
            false,
            "desc",
            input.limit ?? 50
        )) {
            if (seen.has(tx.txHash)) continue;
            seen.add(tx.txHash);

            try {
                const txData = await cccClient.getTransaction(tx.txHash);
                if (!txData) {
                    console.log('[MonitorTransactionsTool] missing txData', tx.txHash);
                    continue;
                }

                // Filter and sum only the outputs whose lock script matches the monitored address
                const targetLock = script;
                const outputs = txData.transaction.outputs;
                const totalAmount = outputs.reduce(
                    (sum: bigint, output: any) => {
                        const isMatch =
                            output.lock.codeHash === targetLock.codeHash &&
                            output.lock.hashType === targetLock.hashType &&
                            output.lock.args === targetLock.args;

                        return isMatch ? sum + output.capacity : sum;
                    },
                    0n
                );

                newTransactions.push({
                    txHash: tx.txHash,
                    blockNumber: tx.blockNumber?.toString() ?? null,
                    amountCkb: (Number(totalAmount) / 1e8).toFixed(8),
                    amountShannons: totalAmount.toString(),
                    toAddress: input.address,
                    status: txData.status,
                });
            } catch (error) {
                console.error('[MonitorTransactionsTool] parse failed', {
                    txHash: tx.txHash,
                    error,
                });
            }
        }

        const nextFromBlock = "0x" + currentBlock.toString(16);

        return {
            address: input.address,
            scannedRange: {
                from: "0x" + fromBlock.toString(16),
                to: nextFromBlock,
            },
            newTransactionCount: newTransactions.length,
            transactions: newTransactions,
            nextFromBlock,
        };
    },
};
