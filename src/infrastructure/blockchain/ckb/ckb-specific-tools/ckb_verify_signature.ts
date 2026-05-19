import { BlockchainTool } from "../../types";
import { ccc, cccClient } from "./ckb_wallet_tool";
import { VerifySignatureInput, VerifySignatureSchema } from "./ckb_contracts_tool";

/**
 * Verifies a signature produced by signMessage.
 */
export async function verifySignature(
    message: string,
    signatureJson: string,
    expectedAddress: string
): Promise<boolean> {
    try {
        const signature = JSON.parse(signatureJson);

        const isValid = await ccc.Signer.verifyMessage(message, signature);
        if (!isValid) return false;

        const publicKeySigner = new ccc.SignerCkbPublicKey(
            cccClient,
            signature.identity
        );

        const recoveredAddress = await publicKeySigner.getRecommendedAddress();

        return recoveredAddress === expectedAddress;
    } catch (error) {
        console.error('Failed to verify signature:', error);
        return false;
    }
}

/**
 * blockchain.ckb.wallet.verify_signature
 */
export const VerifySignatureTool: BlockchainTool<VerifySignatureInput, boolean> = {
    name: "blockchain.ckb.wallet.verify_signature",
    description: "Verifies a JSON-encoded signature against a plain text message and an expected CKB address.",
    schema: VerifySignatureSchema,
    uiSchema: {
        message: { type: 'string', label: 'Message', placeholder: 'Hello CKB' },
        signatureJson: { type: 'string', label: 'Signature (JSON)', placeholder: '{...}' },
        expectedAddress: { type: 'string', label: 'Expected Address', placeholder: 'ckt1...' }
    },
    async execute(input) {
        return await verifySignature(input.message, input.signatureJson, input.expectedAddress);
    },
};