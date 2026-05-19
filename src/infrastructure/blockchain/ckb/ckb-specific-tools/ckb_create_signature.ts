import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { CreateSignatureInput, CreateSignatureSchema } from "./ckb_contracts_tool";

/**
 * Signs a plain text message using a private key.
 */
export async function createSignature(
    message: string,
    privateKey: string
): Promise<string> {
    const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
    const signature = await signer.signMessage(message);

    return JSON.stringify(signature);
}

/**
 * blockchain.ckb.wallet.create_signature
 */
export const CreateSignatureTool: BlockchainTool<CreateSignatureInput, string> = {
    name: "blockchain.ckb.wallet.create_signature",
    description: "Signs a plain text message using a CKB private key. Returns a JSON-encoded signature.",
    schema: CreateSignatureSchema,
    uiSchema: {
        message: { type: 'string', label: 'Message', placeholder: 'Hello CKB' },
        privateKey: { type: 'string', label: 'Private Key', placeholder: '0x...' }
    },
    async execute(input) {
        return await createSignature(input.message, input.privateKey);
    },
};