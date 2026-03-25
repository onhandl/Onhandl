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
        currency: { type: 'select', label: 'Currency', options: ['CKB', 'UDT'] }
    },
    async execute(input) {
        return await fiberRpcCall("new_invoice", [{
            amount: input.amount,
            currency: input.currency,
            description: input.description,
            expiry: input.expiry,
            payment_hash: input.payment_hash
        }]);
    },
};

export const DecodeInvoiceSchema = z.object({
    invoice: z.string().startsWith("fib", "Fiber invoice must start with fibb, fibt, or fibd"),
});

export type DecodeInvoiceInput = z.infer<typeof DecodeInvoiceSchema>;

export const DecodeInvoiceTool: BlockchainTool<DecodeInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.decode",
    description: "Decodes a Fiber invoice string to read its amount, payment hash, expiry, and payee public key.",
    schema: DecodeInvoiceSchema,
    uiSchema: {
        invoice: { type: 'string', label: 'Invoice String', placeholder: 'fiber_invoice...' }
    },
    async execute(input) {
        return await fiberRpcCall("parse_invoice", [{
            invoice: input.invoice
        }]);
    },
};

export const invoiceTools = [
    GenerateInvoiceTool,
    DecodeInvoiceTool,
];
