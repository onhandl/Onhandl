/**
 * Supported blockchain networks for payment links.
 */
export type PaymentLinkChain = "CKB" | string;

/**
 * The standard payload for a generalized payment link.
 */
export interface PaymentLinkPayload {
    version: number;
    chain: PaymentLinkChain;
    recipientAddress: string;
    signerAddress: string;
    amount: string;
    asset: string;
    issuedAt: number;
    expiresAt?: number;
    reference?: string;
    memo?: string;
    metadata?: Record<string, string>;
}

/**
 * The structure of a parsed and decoded payment link.
 */
export interface ParsedPaymentLink {
    version: string;
    payload: PaymentLinkPayload;
    signature: string;
}

/**
 * Parameters for generating a new payment link.
 */
export interface PaymentLinkParams extends Omit<PaymentLinkPayload, 'version' | 'issuedAt'> {
    version?: number;
    issuedAt?: number;
}

// ─── Chain Transaction Verification ──────────────────────────────────────────

/** Normalised result returned by every chain-specific transaction verifier. */
export interface ChainVerificationResult {
    /** The chain identifier (e.g. "CKB"). */
    chain: string;
    /** The transaction hash that was inspected. */
    txHash: string;
    /** Whether the transaction satisfies all requirements for this payment link. */
    isPaid: boolean;
    /** High-level outcome of the chain lookup. */
    status: 'valid' | 'invalid' | 'not_found';
    /** True when an output address matches the expected recipient. */
    matchedRecipient: boolean;
    /** True when the matched output value is >= the required amount. */
    matchedAmount: boolean;
    /** Actual amount paid, in standard units (e.g. CKB, not Shannons). */
    paidAmount: string;
    /**
     * Address that sent this transaction; empty string when not derivable.
     */
    payerAddress: string;
    /** Chain-specific raw data kept for storage / audit. */
    verificationData: Record<string, unknown>;
}

/** Every chain-specific payment verifier must implement this contract. */
export interface ChainTransactionVerifier {
    chain: string;

    /**
     * Returns the required fields for transaction verification on this chain.
     */
    getRequiredVerificationFields(): string[];

    /**
     * Verifies a transaction satisfies the payment link requirements.
     * @param input Chain-specific verification data (e.g., { txHash: '0x...' })
     */
    verifyTransaction(
        input: Record<string, any>,
        expectedRecipient: string,
        expectedAmount: string,
        expectedAsset: string,
    ): Promise<ChainVerificationResult>;
}

export class PaymentLinkError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'PaymentLinkError';
    }
}
