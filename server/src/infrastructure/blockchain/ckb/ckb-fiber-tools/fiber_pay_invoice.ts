import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { PayInvoiceInput, PayInvoiceSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.payment.pay_invoice
 */
export const PayInvoiceTool: BlockchainTool<PayInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.payment.pay_invoice",
    description: "Sends a Fiber payment to an invoice. fee_limit: max shannons to pay for routing. timeout: seconds (default 60).",
    schema: PayInvoiceSchema,
    uiSchema: {
        invoice: { type: "string", label: "Fiber Invoice", placeholder: "fibt1..." },
        fee_limit: { type: "string", label: "Fee Limit (Shannons)", placeholder: "1000" },
    },
    async execute(input) {
        return await fiberRpcCall("send_payment", [{
            invoice: input.invoice,
            fee_limit: input.fee_limit,
            timeout: input.timeout,
        }]);
    },
};
