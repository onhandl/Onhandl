import { PaymentLinkPayload } from '../../../core/payments/payment-links/payment-link.types';
import { ChainPaymentLinkAdapter } from '../../../core/payments/payment-links/chain-payment-link-adapter';
import { createSignature } from './ckb-specific-tools/ckb_create_signature';
import { verifySignature } from './ckb-specific-tools/ckb_verify_signature';

/**
 * CkbPaymentLinkAdapter: Implementation of ChainPaymentLinkAdapter for the CKB network.
 */
export class CkbPaymentLinkAdapter implements ChainPaymentLinkAdapter {
    readonly chain = "CKB";

    /**
     * Returns the list of required fields for CKB payment links.
     */
    getRequiredFields(): string[] {
        return ["recipientAddress", "signerAddress", "amount", "asset"];
    }

    /**
     * Validates if an address follows CKB mainnet (ckb) or testnet (ckt) prefix.
     */
    validateAddress(address: string): boolean {
        return address.startsWith("ckb") || address.startsWith("ckt");
    }

    /**
     * Canonicalizes the payload into a URL-encoded style string for deterministic signing.
     */
    canonicalizePayload(payload: PaymentLinkPayload): string {
        const parts = [
            `version=${payload.version}`,
            `chain=${payload.chain.toUpperCase()}`,
            `recipientAddress=${payload.recipientAddress}`,
            `signerAddress=${payload.signerAddress}`,
            `amount=${payload.amount}`,
            `asset=${payload.asset}`,
            `issuedAt=${payload.issuedAt}`,
            `expiresAt=${payload.expiresAt || ""}`,
            `reference=${payload.reference || ""}`,
            `memo=${payload.memo || ""}`,
        ];

        // Add metadata in alphabetical order for determinism
        if (payload.metadata) {
            const sortedKeys = Object.keys(payload.metadata).sort();
            for (const key of sortedKeys) {
                parts.push(`meta.${key}=${payload.metadata[key]}`);
            }
        }

        return parts.join("&");
    }

    /**
     * Signs the payload using CKB-specific signing tools.
     */
    async signPayload(payload: PaymentLinkPayload, signerSecret: string): Promise<string> {
        const message = this.canonicalizePayload(payload);
        return createSignature(message, signerSecret);
    }

    /**
     * Verifies the signature using CKB-specific verification tools.
     */
    async verifyPayloadSignature(
        payload: PaymentLinkPayload,
        signature: string,
        expectedSignerAddress: string
    ): Promise<boolean> {
        const message = this.canonicalizePayload(payload);
        return verifySignature(message, signature, expectedSignerAddress);
    }
}
