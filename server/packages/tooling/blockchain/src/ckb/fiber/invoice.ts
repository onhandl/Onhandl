import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./node_admin";

export const GenerateInvoiceSchema = z.object({
    amount: z.string().optional().describe("Amount in shannons. E.g. '100000000' for 1 CKB. Omit for any-amount invoice."),
    currency: z.enum(["Fibb", "Fibt", "Fibd"]).optional().describe("Fibb=Mainnet, Fibt=Testnet, Fibd=Devnet. Defaults to Fibt"),
    payment_hash: z.string().optional(),
    description: z.string().optional(),
    expiry: z.number().optional().describe("Defaults to 3600 seconds"),
});

export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;

export const GenerateInvoiceTool: BlockchainTool<GenerateInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.generate",
    description: "Creates a new Fiber invoice (BOLT-11 style) to receive a payment over the Fiber network.",
    schema: GenerateInvoiceSchema,
    uiSchema: {
        amount: { type: 'string', label: 'Amount (shannons)', placeholder: '10000' },
        description: { type: 'string', label: 'Description', placeholder: 'Payment for service' },
        currency: { type: 'select', label: 'Currency', options: ['Fibt', 'Fibb', 'Fibd'] }
    },
    async execute(input) {
        const currencyMap: Record<string, "Fibb" | "Fibt" | "Fibd"> = {
            'CKB': 'Fibt', // Assuming CKB maps to Fibt (Testnet) by default, adjust as needed for mainnet/devnet
            // 'UDT': 'Fibt', // UDT support would require more specific handling if it's a different currency type
        };
        const mappedCurrency = input.currency ? currencyMap[input.currency] || input.currency : 'Fibt';

        return await fiberRpcCall("new_invoice", [{
            amount: input.amount,
            currency: mappedCurrency,
            description: input.description,
            expiry: input.expiry,
            payment_hash: input.payment_hash
        }]);
    },
};

export const DecodeInvoiceSchema = z.object({
    invoice: z.string().startsWith("fib", "Fiber invoice must start with fibb, fibt, or fibd"),
    timeout: z.number().optional().describe("Timeout in seconds for the invoice lookup. Defaults to 60 seconds."),
});

export type DecodeInvoiceInput = z.infer<typeof DecodeInvoiceSchema>;

export const DecodeInvoiceTool: BlockchainTool<DecodeInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.decode",
    description: "Decodes a Fiber invoice string to read its amount, payment hash, expiry, and payee public key.",
    schema: DecodeInvoiceSchema,
    uiSchema: {
        invoice: { type: 'string', label: 'Invoice String', placeholder: 'fiber_invoice...' },
        timeout: { type: 'number', label: 'Timeout (seconds)', placeholder: '60' }
    },
    async execute(input) {
        return await fiberRpcCall("parse_invoice", [{
            invoice: input.invoice,
            timeout: input.timeout,
        }]);
    },
};

export const invoiceTools = [
    GenerateInvoiceTool,
    DecodeInvoiceTool,
];
