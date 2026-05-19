import { PaymentLinkCodec } from './payment-link.codec';
import { ChainPaymentLinkAdapter } from './chain-payment-link-adapter';
import { PaymentLinkPayload, PaymentLinkParams, ParsedPaymentLink, PaymentLinkError } from './payment-link.types';

/**
 * PaymentLinkService: The core engine for generating and validating multi-chain payment links.
 */
export class PaymentLinkService {
    private static adapters: Map<string, ChainPaymentLinkAdapter> = new Map();
    private static readonly PROTOCOL = 'payl';
    private static readonly VERSION = 'v1';

    /**
     * Registers a chain adapter.
     */
    static registerAdapter(adapter: ChainPaymentLinkAdapter): void {
        this.adapters.set(adapter.chain.toUpperCase(), adapter);
    }

    /**
     * Generates a signed payment link string.
     */
    static async generatePaymentLink(
        params: PaymentLinkParams,
        signerSecret: string
    ): Promise<string> {
        const chainKey = params.chain.toUpperCase();
        const adapter = this.adapters.get(chainKey);

        if (!adapter) {
            throw new PaymentLinkError(`Unsupported chain: ${params.chain}`);
        }

        // 1. Validate addresses
        if (!adapter.validateAddress(params.recipientAddress)) {
            throw new PaymentLinkError(`Invalid recipient address for ${params.chain}`);
        }
        if (!adapter.validateAddress(params.signerAddress)) {
            throw new PaymentLinkError(`Invalid signer address for ${params.chain}`);
        }

        // 2. Build payload
        const payload: PaymentLinkPayload = {
            ...params,
            version: params.version || 1,
            issuedAt: params.issuedAt || Date.now(),
        };

        // 3. Sign payload
        const signature = await adapter.signPayload(payload, signerSecret);

        // 4. Encode
        const encodedPayload = PaymentLinkCodec.encodePayload(payload);
        const encodedSig = PaymentLinkCodec.encodeSignature(signature);

        return `${this.PROTOCOL}:${this.VERSION}.${encodedPayload}.${encodedSig}`;
    }

    /**
     * Parses a raw payment link string into its components.
     */
    static parsePaymentLink(link: string): ParsedPaymentLink {
        if (!link.startsWith(`${this.PROTOCOL}:`)) {
            throw new Error(`Invalid protocol. Expected ${this.PROTOCOL}:`);
        }

        const parts = link.substring(this.PROTOCOL.length + 1).split('.');
        if (parts.length !== 3) {
            throw new Error('Malformed payment link structure');
        }

        const [version, encodedPayload, encodedSig] = parts;

        const payload = PaymentLinkCodec.decodePayload(encodedPayload);
        const signature = PaymentLinkCodec.decodeSignature(encodedSig);

        return {
            version,
            payload,
            signature
        };
    }

    /**
     * Validates a payment link (expiry and signature).
     */
    static async validatePaymentLink(link: string): Promise<boolean> {
        try {
            const { payload, signature } = this.parsePaymentLink(link);

            // 1. Check expiry
            if (PaymentLinkCodec.isExpired(payload)) {
                return false;
            }

            // 2. Get adapter
            const adapter = this.adapters.get(payload.chain.toUpperCase());
            if (!adapter) {
                return false;
            }

            // 3. Verify signature
            return await adapter.verifyPayloadSignature(payload, signature, payload.signerAddress);
        } catch (err) {
            return false;
        }
    }
}
