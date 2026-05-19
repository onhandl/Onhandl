import { ccc, cccClient } from './ckb-specific-tools/ckb_wallet_tool';
import {
    ChainVerificationResult,
    ChainTransactionVerifier,
} from '../../../core/payments/payment-links/payment-link.types';

/**
 * Derive a CKB bech32 address string from a lock Script using the CCC SDK.
 *
 * CellOutput objects (from getTransaction) expose `.lock` (Script) and `.capacity`
 * (bigint in Shannons), but do NOT have an `.address` property.
 * The correct pattern per the CCC SDK is `new ccc.Address(script, client)`.
 */
function lockToAddress(lock: ReturnType<typeof ccc.Script.from>): string {
    return new ccc.Address(lock, cccClient).toString();
}

/**
 * CkbPaymentService: Chain-specific payment transaction verifier for CKB.
 *
 * Owns ALL low-level CKB blockchain logic:
 *   - transaction fetching
 *   - output / recipient matching
 *   - Shannon → CKB conversion  (1 CKB = 100,000,000 Shannons)
 *   - status derivation
 *   - best-effort payer derivation
 *
 * Returns a normalised ChainVerificationResult so the general service never
 * touches blockchain-level details.
 */
export const CkbPaymentService: ChainTransactionVerifier = {
    chain: 'CKB',

    getRequiredVerificationFields(): string[] {
        return ['txHash'];
    },

    async verifyTransaction(
        input: Record<string, any>,
        expectedRecipient: string,
        expectedAmount: string,
        _expectedAsset: string,   // only "CKB" is supported; reserved for future multi-asset
    ): Promise<ChainVerificationResult> {
        const txHash = input.txHash;
        if (!txHash) {
            throw new Error('CKB verification requires txHash');
        }
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

        // 1. Fetch transaction via CCC SDK
        let tx: Awaited<ReturnType<typeof cccClient.getTransaction>>;
        try {
            tx = await cccClient.getTransaction(txHash);
        } catch (err) {
            return { ...base, status: 'invalid', verificationData: { error: String(err) } };
        }

        if (!tx) return base;   // not_found

        // 2. Parse outputs.
        //    CellOutput fields per CCC SDK:
        //      .capacity  — bigint (Shannons)
        //      .lock      — Script (the ownership lock, equivalent to "address")
        //      .type      — Script | undefined (optional token/script type)
        //    There is NO `.address` property — derive it via new ccc.Address(output.lock, client).
        const rawOutputs: { address: string; capacityShannons: bigint }[] = [];
        for (const output of tx.transaction.outputs) {
            const address = lockToAddress(output.lock);
            rawOutputs.push({ address, capacityShannons: output.capacity });
        }

        // 3. Match recipient + amount
        // expectedAmount is in CKB (e.g. "10.5"); convert to Shannons for comparison.
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

        // 4. Best-effort payer derivation.
        //    Walk back to the first input's previous output and read its lock script address.
        let payerAddress = '';
        try {
            const firstInput = tx.transaction.inputs[0];
            if (firstInput) {
                const prevTx = await cccClient.getTransaction(firstInput.previousOutput.txHash);
                if (prevTx) {
                    const prevIndex = Number(firstInput.previousOutput.index);
                    const prevOutput = prevTx.transaction.outputs[prevIndex];
                    if (prevOutput) {
                        payerAddress = lockToAddress(prevOutput.lock);
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
