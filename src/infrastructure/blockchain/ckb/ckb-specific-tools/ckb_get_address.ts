import { BlockchainTool } from "../../types";
import { GetAddressInput, GetAddressSchema } from "./ckb_contracts_tool";
import { getAddress } from "./ckb_wallet_tool";

/**
 * blockchain.ckb.wallet.get_address
 * Derives a CKB address from a private key.
 */
export const GetAddressTool: BlockchainTool<GetAddressInput, string> = {
    name: "blockchain.ckb.wallet.get_address",
    description: "Derives a CKB testnet address from a provided hex private key.",
    schema: GetAddressSchema,
    uiSchema: {
        privateKey: { type: 'string', label: 'Private Key', placeholder: '0x...' }
    },
    async execute(input) {
        return await getAddress(input.privateKey);
    },
};
