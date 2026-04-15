import { z } from "zod";
import { BlockchainTool } from "../types";
import { getCapacities } from "./balance";
import { transferCKB } from "./transferCKB";

// Tool 1: Get CKB Balance
const GetBalanceSchema = z.object({
    address: z.string().describe("The CKB address to check the balance for"),
});

const GetBalanceTool: BlockchainTool<z.infer<typeof GetBalanceSchema>, any> = {
    name: "blockchain.ckb.node.get CKB balance",
    description: "Fetches the total capacity (balance) of a given CKB address in Shannons.",
    schema: GetBalanceSchema,
    uiSchema: {
        address: { type: 'string', label: 'CKB Address', placeholder: 'ckt1q...' }
    },
    async execute(input) {
        const capacities = await getCapacities(input.address);
        return {
            address: input.address,
            shannons: capacities.toString(),
            ckb: (capacities.toBigInt() / BigInt(10 ** 8)).toString()
        };
    },
};

// Tool 2: Transfer CKB
const TransferSchema = z.object({
    from: z.string().describe("The sender's CKB address"),
    to: z.string().describe("The recipient's CKB address"),
    amount: z.number().describe("The amount of CKB to transfer (e.g. 100)"),
    privateKey: z.string().describe("The private key of the sender")
});

const TransferTool: BlockchainTool<z.infer<typeof TransferSchema>, any> = {
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
        const txHash = await transferCKB(input.from, input.to, input.amount, input.privateKey);
        return { txHash };
    },
};

export const agentTools = [
    GetBalanceTool,
    TransferTool,
];
