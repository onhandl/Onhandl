import { PaymentLinkRepository } from './payment-link.repository';
import { CkbPaymentService } from '../../infrastructure/blockchain/ckb/ckb-payment.service';
import { PaymentLinkService as CorePaymentLinkService } from '../../core/payments/payment-links/payment-link.service';
import {
    ChainTransactionVerifier,
    ChainVerificationResult,
} from '../../core/payments/payment-links/payment-link.types';
import { eventBus } from '../../infrastructure/events/eventBus';

/** Registry of chain-specific transaction verifiers. */
const verifiers = new Map<string, ChainTransactionVerifier>([
    ['CKB', CkbPaymentService],
]);

/**
 * Register additional chain verifiers at startup (e.g. EVM, Solana).
 */
export function registerTransactionVerifier(verifier: ChainTransactionVerifier): void {
    verifiers.set(verifier.chain.toUpperCase(), verifier);
}

export interface VerifyPaymentResult {
    success: boolean;
    message: string;
    verification?: ChainVerificationResult;
}

/**
 * PaymentVerificationService: General-purpose payment-link business logic.
 *
 * Responsibilities:
 *   - Fetch and validate the payment-link record (status, expiry, signature).
 *   - Delegate chain-level transaction inspection to the appropriate verifier.
 *   - Persist the normalised result and emit lifecycle events.
 *
 * This service does NOT perform any blockchain-level fetching or parsing.
 */
export const PaymentVerificationService = {
    async verifyPayment(paymentLinkId: string, txHash: string): Promise<VerifyPaymentResult> {
        // 1. Fetch link record
        const linkRecord = await PaymentLinkRepository.findById(paymentLinkId);
        if (!linkRecord) return { success: false, message: 'Payment link not found' };

        // 2. Business-rule guards
        if (linkRecord.status === 'paid') return { success: false, message: 'Payment link already fulfilled' };
        if (linkRecord.status === 'cancelled') return { success: false, message: 'Payment link has been cancelled' };
        if (linkRecord.status === 'expired') return { success: false, message: 'Payment link has expired' };

        // 3. Core cryptographic validation (signature + expiry window)
        const isCoreValid = await CorePaymentLinkService.validatePaymentLink(linkRecord.link);
        if (!isCoreValid) return { success: false, message: 'Invalid or expired payment link signature' };

        // 4. Resolve chain-specific verifier
        const verifier = verifiers.get(linkRecord.chain.toUpperCase());
        if (!verifier) return { success: false, message: `No transaction verifier registered for chain: ${linkRecord.chain}` };

        // 5. Delegate all on-chain verification to the chain layer
        const verification = await verifier.verifyTransaction(
            txHash,
            linkRecord.recipientAddress,
            linkRecord.amount,
            linkRecord.asset,
        );

        if (verification.status === 'not_found') return { success: false, message: 'Transaction not found on chain', verification };
        if (!verification.isPaid) return { success: false, message: 'Transaction does not satisfy payment requirements', verification };

        // 6. Persist the normalised verification result
        await PaymentLinkRepository.markPaid(paymentLinkId, {
            txHash,
            payerAddress: verification.payerAddress,
            paidAmount: verification.paidAmount,
            fulfilledAt: new Date(),
            chain: verification.chain,
            verificationData: verification.verificationData,
        });

        // 7. Emit event
        eventBus.emit('PAYMENT_LINK_PAID', {
            paymentLinkId,
            chain: verification.chain,
            txHash: verification.txHash,
            payerAddress: verification.payerAddress,
            paidAmount: verification.paidAmount,
            workspaceId: linkRecord.workspaceId,
        });

        return { success: true, message: 'Payment verified successfully', verification };
    },
};
