import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { GenerateInvoiceInput, GenerateInvoiceSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.invoice.generate_invoice
 */
export const GenerateInvoiceTool: BlockchainTool<GenerateInvoiceInput, any> = {
    name: "blockchain.ckb_fiber.invoice.generate_invoice",
    description: "Creates a Fiber invoice. amount: shannons (e.g. '100000000' = 1 CKB). Omit for any-amount invoice. currency: Fibb/Fibt/Fibd (Main/Test/Dev).",
    schema: GenerateInvoiceSchema,
    uiSchema: {
        amount: { type: "string", label: "Amount (Shannons)", placeholder: "100000000" },
        description: { type: "string", label: "Description", placeholder: "Payment for services" },
        currency: { type: "select", label: "Currency", options: ["Fibt", "Fibb", "Fibd"] },
    },
    async execute(input) {
        return await fiberRpcCall("add_invoice", [{
            amount: input.amount,
            description: input.description,
            currency: input.currency || "Fibt",
            expiry: input.expiry,
        }]);
    },
};
