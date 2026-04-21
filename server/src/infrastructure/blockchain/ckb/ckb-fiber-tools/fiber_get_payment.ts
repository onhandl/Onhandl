import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { GetPaymentInput, GetPaymentSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.payment.get_payment
 */
export const GetPaymentTool: BlockchainTool<GetPaymentInput, any> = {
    name: "blockchain.ckb_fiber.payment.get_payment",
    description: "Checks the status of a specific payment by its payment hash.",
    schema: GetPaymentSchema,
    uiSchema: {
        payment_hash: { type: "string", label: "Payment Hash", placeholder: "0x..." },
    },
    async execute(input) {
        return await fiberRpcCall("get_payment", [input.payment_hash]);
    },
};
