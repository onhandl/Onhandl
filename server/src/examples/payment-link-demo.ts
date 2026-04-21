/**
 * payment-link-demo.ts
 * Demonstrates end-to-end payment link generation and verification using the
 * new ChainTransactionVerifier-based flow.
 */
import { PaymentLinkService } from '../core/payments/payment-links/payment-link.service';
import { CkbPaymentLinkAdapter } from '../infrastructure/blockchain/ckb/ckb-payment-link.adapter';
import { CkbPaymentService } from '../infrastructure/blockchain/ckb/ckb-payment.service';
import {
    generatePrivateKey,
    getAddress,
} from '../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_wallet_tool';

async function runDemo() {
    console.log('--- Payment Link System Demo ---');

    // 1. Register adapters
    PaymentLinkService.registerAdapter(new CkbPaymentLinkAdapter());

    // 2. Setup identities
    const recipientPk = generatePrivateKey();
    const recipientAddr = await getAddress(recipientPk);
    const signerPk = generatePrivateKey();
    const signerAddr = await getAddress(signerPk);

    console.log('Recipient:', recipientAddr);
    console.log('Signer   :', signerAddr);

    // 3. Generate a payment link
    const link = await PaymentLinkService.generatePaymentLink({
        chain: 'CKB',
        recipientAddress: recipientAddr,
        signerAddress: signerAddr,
        amount: '10.5',
        asset: 'CKB',
        memo: 'Coffee payment',
        expiresAt: Date.now() + 3600 * 1000,
    }, signerPk);

    console.log('\nGenerated Link:', link);

    // 4. Parse
    const parsed = PaymentLinkService.parsePaymentLink(link);
    console.log('\nParsed Payload:', JSON.stringify(parsed.payload, null, 2));

    // 5. Core validation (sig + expiry)
    const isValid = await PaymentLinkService.validatePaymentLink(link);
    console.log('\nCore validation:', isValid ? 'PASS' : 'FAIL');

    // 6. Demonstrate ChainTransactionVerifier (dryrun — no real chain call)
    console.log('\nChainTransactionVerifier contract:', typeof CkbPaymentService.verifyTransaction);
    console.log('To add EVM support: implement ChainTransactionVerifier, register with PaymentVerificationService.registerTransactionVerifier()');
}

runDemo().catch(console.error);
