import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { DecodeInvoiceInput, DecodeInvoiceSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.invoice.decode_invoice
 */
export const DecodeInvoiceTool: BlockchainTool<DecodeInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.decode_invoice",
    description: "Parses a Fiber invoice (fibt...) to see amount, currency, and payment hash. Does NOT pay.",
    schema: DecodeInvoiceSchema,
    uiSchema: {
        invoice: { type: "string", label: "Fiber Invoice", placeholder: "fibt1..." },
    },
    async execute(input) {
        return await fiberRpcCall("parse_invoice", [{ invoice: input.invoice }]);
    },
};
