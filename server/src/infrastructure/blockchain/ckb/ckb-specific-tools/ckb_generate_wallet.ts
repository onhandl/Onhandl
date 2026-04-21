import { BlockchainTool } from "../../types";
import { GenerateWalletInput, GenerateWalletSchema } from "./ckb_contracts_tool";
import { generatePrivateKey, getAddress, generateLockArgs } from "./ckb_wallet_tool";

/**
 * blockchain.ckb.wallet.generate_wallet
 * Generates a new CKB private key and its corresponding address.
 */
export const GenerateWalletTool: BlockchainTool<GenerateWalletInput, any> = {
    name: "blockchain.ckb.wallet.generate_wallet",
    description: "Generates a new CKB private key and its corresponding testnet address. Use this to create new accounts.",
    schema: GenerateWalletSchema,
    async execute(_input) {
        const privateKey = generatePrivateKey();
        const address = await getAddress(privateKey);
        const lockArgs = generateLockArgs(privateKey);

        return {
            privateKey,
            address,
            lock_args: lockArgs
        };
    },
};
