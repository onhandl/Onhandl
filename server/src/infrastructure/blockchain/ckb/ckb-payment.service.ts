import { ccc, cccClient } from './ckb-specific-tools/ckb_wallet_tool';
import {
    ChainVerificationResult,
    ChainTransactionVerifier,
} from '../../../core/payments/payment-links/payment-link.types';

const SHANNONS_PER_CKB = 100_000_000n;

/**
 * CkbPaymentService: Chain-specific payment transaction verifier for CKB.
 *
 * Owns ALL low-level CKB blockchain logic:
 *   - transaction fetching
 *   - output / recipient matching
 *   - Shannon ↔ CKB conversion
 *   - status derivation
 *
 * Returns a normalised ChainVerificationResult so the general service never
 * touches blockchain-level details.
 */
export const CkbPaymentService: ChainTransactionVerifier = {
    chain: 'CKB',

    async verifyTransaction(
        txHash: string,
        expectedRecipient: string,
        expectedAmount: string,
        _expectedAsset: string,   // only "CKB" is supported; reserved for future multi-asset
    ): Promise<ChainVerificationResult> {
        const base: ChainVerificationResult = {
            chain: 'CKB',
            txHash,
            isPaid: false,
            status: 'not_found',
            matchedRecipient: false,
            matchedAmount: false,
            paidAmount: '0',
            payerAddress: '',
            verificationData: {},
        };

        // 1. Fetch transaction
        let tx: Awaited<ReturnType<typeof cccClient.getTransaction>>;
        try {
            tx = await cccClient.getTransaction(txHash);
        } catch (err) {
            return { ...base, status: 'invalid', verificationData: { error: String(err) } };
        }

        if (!tx) return base;                           // not_found

        // 2. Parse outputs
        const rawOutputs: { address: string; capacityShannons: bigint }[] = [];
        for (const output of tx.transaction.outputs) {
            const address = (await output.address).toString();
            rawOutputs.push({ address, capacityShannons: BigInt(output.capacity.toString()) });
        }

        // 3. Match recipient + amount
        const expectedShannons = BigInt(Math.round(parseFloat(expectedAmount) * 1e8));

        const matchedOutput = rawOutputs.find(
            (o) => o.address === expectedRecipient && o.capacityShannons >= expectedShannons,
        );

        const matchedRecipient = rawOutputs.some((o) => o.address === expectedRecipient);
        const matchedAmount = !!matchedOutput;
        const isPaid = matchedRecipient && matchedAmount;

        const paidAmount = matchedOutput
            ? (Number(matchedOutput.capacityShannons) / 1e8).toString()
            : '0';

        // 4. Best-effort payer derivation (first input script address)
        let payerAddress = '';
        try {
            const firstInput = tx.transaction.inputs[0];
            if (firstInput) {
                const prevTx = await cccClient.getTransaction(firstInput.previousOutput.txHash);
                if (prevTx) {
                    const prevIndex = Number(firstInput.previousOutput.index);
                    const prevOutput = prevTx.transaction.outputs[prevIndex];
                    if (prevOutput) {
                        payerAddress = (await prevOutput.address).toString();
                    }
                }
            }
        } catch { /* payer derivation is best-effort; silence errors */ }

        return {
            chain: 'CKB',
            txHash,
            isPaid,
            status: 'valid',
            matchedRecipient,
            matchedAmount,
            paidAmount,
            payerAddress,
            verificationData: {
                outputCount: rawOutputs.length,
                outputs: rawOutputs.map((o) => ({
                    address: o.address,
                    capacityCKB: (Number(o.capacityShannons) / 1e8).toString(),
                })),
            },
        };
    },
};
