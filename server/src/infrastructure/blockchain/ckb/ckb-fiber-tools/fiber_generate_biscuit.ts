import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { GenerateBiscuitInput, GenerateBiscuitSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.node_admin.generate_biscuit
 */
export const GenerateBiscuitTool: BlockchainTool<GenerateBiscuitInput, any> = {
    name: "blockchain.ckb_fiber.node_admin.generate_biscuit",
    description: "Generates a Fiber-compatible Biscuit token for authentication. Requires the node's block-serialized private key.",
    schema: GenerateBiscuitSchema,
    uiSchema: {
        private_key_hex: { type: "string", label: "Private Key (hex)", placeholder: "0x..." },
        permissions: { type: "string", label: "Permissions (JSON array)", placeholder: '["admin"]' },
    },
    async execute(input) {
        return await fiberRpcCall("generate_biscuit", [input.private_key_hex, input.permissions || ["admin"]]);
    },
};
