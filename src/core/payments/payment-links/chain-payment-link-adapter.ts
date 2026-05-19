import { PaymentLinkPayload } from './payment-link.types';

/**
 * Interface that all chain-specific payment link adapters must implement.
 */
export interface ChainPaymentLinkAdapter {
    /**
     * The chain identifier (e.g., "CKB", "EVM").
     */
    chain: string;

    /**
     * Returns the list of required fields for this chain (e.g., ["recipientAddress", "amount"]).
     */
    getRequiredFields(): string[];

    /**
     * Validates the format of an address for this chain.
     */
    validateAddress(address: string): boolean;

    /**
     * Canonicalizes the payload into a stable string format for signing.
     */
    canonicalizePayload(payload: PaymentLinkPayload): string;

    /**
     * Signs the canonicalized payload using the provider's secret key.
     */
    signPayload(payload: PaymentLinkPayload, signerSecret: string): Promise<string>;

    /**
     * Verifies the signature of a payload.
     */
    verifyPayloadSignature(
        payload: PaymentLinkPayload,
        signature: string,
        expectedSignerAddress: string
    ): Promise<boolean>;
}
