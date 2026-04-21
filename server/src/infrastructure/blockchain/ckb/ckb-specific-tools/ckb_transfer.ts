import { z } from "zod";
import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { TransferSchema } from "./ckb_contracts_tool";


//Helper function to send CKB
async function sendCKB(
    privateKey: string,
    toAddress: string,
    ckbAmount: number
): Promise<string> {
    try {
        const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
        const { script: toLock } = await ccc.Address.fromString(toAddress, cccClient);

        const tx = ccc.Transaction.from({
            outputs: [{
                lock: toLock,
                capacity: ccc.fixedPointFrom(ckbAmount.toString())
            }],
            outputsData: [],
        });

        await tx.completeInputsByCapacity(signer);
        await tx.completeFeeBy(signer, 1000);

        return signer.sendTransaction(tx);
    } catch (error) {
        console.error('Error sending CKB:', error);
        throw new Error('Transaction failed: ' + (error as Error).message);
    }
}


//Tool: Transfer CKB
export const TransferTool: BlockchainTool<z.infer<typeof TransferSchema>, any> = {
    name: "blockchain.ckb.node.transfer ckb",
    description: "Transfers CKB from one address to another using the sender's private key.",
    schema: TransferSchema,
    uiSchema: {
        from: { type: 'string', label: 'From Address' },
        to: { type: 'string', label: 'To Address' },
        amount: { type: 'number', label: 'Amount (CKB)' },
        privateKey: { type: 'string', label: 'Private Key', placeholder: '0x...' }
    },
    async execute(input) {
        const txHash = await sendCKB(input.privateKey, input.to, input.amount);
        return { txHash };
    },
};
