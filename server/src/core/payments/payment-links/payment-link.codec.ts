import { PaymentLinkPayload } from './payment-link.types';

/**
 * PaymentLinkCodec: Pure logic for encoding and decoding payment link payloads.
 */
export const PaymentLinkCodec = {
    /**
     * Encodes a payload to a base64url string.
     */
    encodePayload(payload: PaymentLinkPayload): string {
        const json = JSON.stringify(payload);
        return Buffer.from(json).toString('base64url');
    },

    /**
     * Decodes a payload from a base64url string.
     */
    decodePayload(encoded: string): PaymentLinkPayload {
        try {
            const json = Buffer.from(encoded, 'base64url').toString('utf8');
            return JSON.parse(json);
        } catch (err) {
            throw new Error('Invalid payment link payload encoding');
        }
    },

    /**
     * Encodes a signature to a base64url string.
     */
    encodeSignature(signature: string): string {
        return Buffer.from(signature).toString('base64url');
    },

    /**
     * Decodes a signature from a base64url string.
     */
    decodeSignature(encoded: string): string {
        return Buffer.from(encoded, 'base64url').toString('utf8');
    },

    /**
     * Validates if a payload has expired.
     */
    isExpired(payload: PaymentLinkPayload): boolean {
        if (!payload.expiresAt) return false;
        return Date.now() > payload.expiresAt;
    }
};
