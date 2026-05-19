import * as crypto from "crypto";

/**
 * Generates a high-entropy 32-byte hex private key.
 */
export function generatePrivateKey(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return "0x" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

