import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./node_admin";

/** Convert decimal shannons or existing hex to 0x-prefixed hex string. */
function toHexAmount(value: string): string {
    const raw = value.trim();
    if (/^0x[0-9a-fA-F]+$/.test(raw)) return raw;
    if (/^\d+$/.test(raw)) return '0x' + BigInt(raw).toString(16);
    throw new Error(`Amount must be a decimal integer (e.g. "100000000") or hex string (e.g. "0x5f5e100"). Got: "${value}"`);
}

const GenerateInvoiceSchema = z.object({
    amount: z.string().optional().describe("Amount in shannons. E.g. '100000000' for 1 CKB. Omit for any-amount invoice."),
    currency: z.enum(["Fibb", "Fibt", "Fibd"]).optional()
        .describe("Fibt=Testnet, Fibb=Mainnet, Fibd=Devnet. Defaults to Fibt"),
    payment_hash: z.string().optional(),
    description: z.string().optional(),
    expiry: z.number().optional().describe("Defaults to 3600 seconds"),
});

type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;

const GenerateInvoiceTool: BlockchainTool<GenerateInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.generate",
    description: "Creates a new Fiber invoice (BOLT-11 style) to receive a payment over the Fiber network.",
    schema: GenerateInvoiceSchema,
    uiSchema: {
        amount: { type: 'string', label: 'Amount (shannons)', placeholder: '100000000  →  1 CKB  |  hex ok: 0x5f5e100' },
        description: { type: 'string', label: 'Description', placeholder: 'Payment for service' },
        currency: {
            type: 'radio',
            label: 'Currency',
            options: [
                { label: 'Test Token (Fibt)', value: 'Fibt' },
                { label: 'Bitcoin-like (Fibb)', value: 'Fibb' },
                { label: 'Dollar-like (Fibd)', value: 'Fibd' },
            ],
        },
    },
    async execute(input) {
        const mappedCurrency = input.currency ?? 'Fibt';

        return await fiberRpcCall("new_invoice", [{
            amount: input.amount ? toHexAmount(input.amount) : undefined,
            currency: mappedCurrency,
            description: input.description,
            expiry: input.expiry,
            payment_hash: input.payment_hash,
        }]);
    },
};

const DecodeInvoiceSchema = z.object({
    invoice: z.string().startsWith("fib", "Fiber invoice must start with fibb, fibt, or fibd"),
    timeout: z.number().optional().describe("Timeout in seconds for the invoice lookup. Defaults to 60 seconds."),
});

type DecodeInvoiceInput = z.infer<typeof DecodeInvoiceSchema>;

const DecodeInvoiceTool: BlockchainTool<DecodeInvoiceInput, any> = {
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
