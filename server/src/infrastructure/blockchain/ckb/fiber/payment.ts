import { z } from "zod";
import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./node_admin";

const PayInvoiceSchema = z.object({
    invoice: z.string(),
    fee_limit: z.string().optional().describe("Maximum routing fee willing to pay. E.g. maximum shannons."),
    timeout: z.number().optional().describe("Defaults to 60 seconds"),
});

type PayInvoiceInput = z.infer<typeof PayInvoiceSchema>;

const PayInvoiceTool: BlockchainTool<PayInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.payment.pay_invoice",
    description: "Initiates a multi-hop payment to fulfill a Fiber invoice. Routes the payment through HTLCs across the network graph.",
    schema: PayInvoiceSchema,
    uiSchema: {
        invoice: { type: 'string', label: 'Invoice String', placeholder: 'fiber_invoice...' },
        fee_limit: { type: 'string', label: 'Maximum Fee (shannons)', placeholder: '1000' },
        timeout: { type: 'number', label: 'Timeout (seconds)', placeholder: '60' }
    },
    async execute(input) {
        return await fiberRpcCall("pay_invoice", [{
            invoice: input.invoice,
            fee_limit: input.fee_limit,
            timeout: input.timeout
        }]);
    },
};

const GetPaymentSchema = z.object({
    payment_hash: z.string(),
});

type GetPaymentInput = z.infer<typeof GetPaymentSchema>;

const GetPaymentTool: BlockchainTool<GetPaymentInput, any> = {
    name: "blockchain.ckb_fiber.payment.status",
    description: "Checks the status of an outgoing payment by its payment hash (inflight, success, or failed).",
    schema: GetPaymentSchema,
    uiSchema: {
        payment_hash: { type: 'string', label: 'Payment Hash', placeholder: '0x...' }
    },
    async execute(input) {
        return await fiberRpcCall("get_payment", [{
            payment_hash: input.payment_hash
        }]);
    },
};

export const paymentTools = [
    PayInvoiceTool,
    GetPaymentTool,
];
