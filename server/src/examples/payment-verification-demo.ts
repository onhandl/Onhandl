/**
 * payment-verification-demo.ts
 * Integration demo for the ChainTransactionVerifier-based verification flow.
 */
import { PaymentLinkService } from '../core/payments/payment-links/payment-link.service';
import { CkbPaymentLinkAdapter } from '../infrastructure/blockchain/ckb/ckb-payment-link.adapter';
import { CkbPaymentService } from '../infrastructure/blockchain/ckb/ckb-payment.service';
import {
    generatePrivateKey,
    getAddress,
} from '../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_wallet_tool';

async function runDemo() {
    console.log('--- Payment Verification Demo ---');

    // 1. Register payment-link signing adapter
    PaymentLinkService.registerAdapter(new CkbPaymentLinkAdapter());

    // 2. Setup identities
    const recipientPk = generatePrivateKey();
    const recipientAddr = await getAddress(recipientPk);
    const signerPk = generatePrivateKey();
    const signerAddr = await getAddress(signerPk);

    // 3. Generate a link
    const link = await PaymentLinkService.generatePaymentLink({
        chain: 'CKB',
        recipientAddress: recipientAddr,
        signerAddress: signerAddr,
        amount: '10.5',
        asset: 'CKB',
        expiresAt: Date.now() + 3600 * 1000,
    }, signerPk);

    console.log('Link:', link);

    // 4. Core validation (signature + expiry)
    const coreValid = await PaymentLinkService.validatePaymentLink(link);
    console.log('Core valid:', coreValid);

    // 5. Show normalized verifier contract
    console.log('\nCkbPaymentService implements ChainTransactionVerifier:');
    console.log('  .chain             =', CkbPaymentService.chain);
    console.log('  .verifyTransaction =', typeof CkbPaymentService.verifyTransaction);

    console.log('\nTo add EVM: implement ChainTransactionVerifier → import PaymentVerificationService.registerTransactionVerifier()');
}

runDemo().catch(console.error);
