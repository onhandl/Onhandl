import { BlockchainTool } from "../../index";
import { fiberRpcCall } from "./fiber_rpc_client";
import { ShutdownChannelInput, ShutdownChannelSchema } from "./fiber_contracts";

/**
 * blockchain.ckb_fiber.channel.shutdown_channel
 */
export const ShutdownChannelTool: BlockchainTool<ShutdownChannelInput, any> = {
    name: "blockchain.ckb_fiber.channel.shutdown_channel",
    description: "Cooperatively close a Fiber channel. Sends shutdown_channel RPC with a secp256k1 close_script. The channel must be in CHANNEL_READY state.",
    schema: ShutdownChannelSchema,
    uiSchema: {
        channel_id: {
            type: "string",
            label: "Channel ID",
            placeholder: "0xcc0b319e3b1155196a4ffc6c2f71205...",
        },
        close_address_args: {
            type: "string",
            label: "CKB Lock Args (20-byte hex)",
            placeholder: "0x4d4ae843f62f05bf1ac601b3dbd43b5b4f9a006a",
        },
        fee_rate: {
            type: "string",
            label: "Fee Rate (hex shannons/KB)",
            placeholder: "0x3FC",
        },
    },
    async execute(input) {
        return await fiberRpcCall("shutdown_channel", [{
            channel_id: input.channel_id,
            close_script: {
                // Standard secp256k1 single-sig lock (mainnet + testnet share this code_hash)
                code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                hash_type: "type",
                args: input.close_address_args,
            },
            fee_rate: input.fee_rate ?? "0x3FC",
        }]);
    },
};
