import { z } from "zod";
import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { GetBalanceSchema } from "./ckb_contracts_tool";

//Helper function to get balance
async function getBalance(address: string): Promise<string> {
    try {
        const { script: lock } = await ccc.Address.fromString(address, cccClient);
        let total = ccc.Zero;

        for await (const cell of cccClient.findCellsByLock(lock, null, true)) {
            total += cell.cellOutput.capacity;
        }

        return ccc.fixedPointToString(total);
    } catch (error) {
        console.error('Error getting balance:', error);
        throw new Error('Failed to fetch balance');
    }
}


// Tool: Get CKB Balance
export const GetBalanceTool: BlockchainTool<z.infer<typeof GetBalanceSchema>, any> = {
    name: "blockchain.ckb.node.get CKB balance",
    description: "Fetches the total capacity (balance) of a given CKB address in Shannons.",
    schema: GetBalanceSchema,
    uiSchema: {
        address: { type: 'string', label: 'CKB Address', placeholder: 'ckt1q...' }
    },
    async execute(input) {
        const ckb = await getBalance(input.address);

        return {
            address: input.address,
            ckb,
        };
    }
};
