// src/shared/utils/ckb-validator.ts

import * as cccModule from '@ckb-ccc/core';
// import { ccc as cccCore } from "@ckb-ccc/core";

// ─── Config ────────────────────────────────────────────────────────────────────
export const ccc = (cccModule as any).default || cccModule;
export const cccClient = new ccc.ClientPublicTestnet();



/**
 * Derives lock args from a private key (Blake160 of public key).
 */
export function generateLockArgs(privateKey: string): string {
    return ccc.hd.key.privateKeyToBlake160(privateKey);
}

/**
 * Derives a CKB address from a private key.
 */
export async function getAddress(privateKey: string): Promise<string> {
    try {
        const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
        return (await signer.getAddressObjSecp256k1()).toString();
    } catch (error) {
        console.error('Error getting address:', error);
        throw new Error('Failed to derive address from private key');
    }
}

/**
 * Validate a CKB address and return normalized address
 * @param address - The CKB address to validate
 * @returns The normalized address string if valid
 * @throws Error with message "Invalid CKB address" if validation fails
 */
export async function validateCkbAddress(address: string): Promise<string> {
    if (!address || typeof address !== 'string') {
        throw new Error("Invalid CKB address: Address is required");
    }
    
    try {
        // Try to parse the address
        const addr = await ccc.Address.fromString(address, cccClient);
        
        // Additional validation checks
        if (!addr.script || !addr.script.codeHash) {
            throw new Error("Invalid CKB address: Missing script");
        }
        
        return address;
    } catch (error: any) {
        console.error("❌ Invalid CKB address:", error.message);
        throw new Error("Invalid CKB address");
    }
}

/**
 * Batch validate multiple CKB addresses
 * @param addresses - Array of CKB addresses to validate
 * @returns Object with valid and invalid addresses
 */
export async function validateMultipleCkbAddresses(addresses: string[]): Promise<{
    valid: Array<{ original: string; normalized: string }>;
    invalid: string[];
}> {
    const result = {
        valid: [] as Array<{ original: string; normalized: string }>,
        invalid: [] as string[]
    };
    
    for (const address of addresses) {
        try {
            const normalized = await validateCkbAddress(address);
            result.valid.push({ original: address, normalized });
        } catch (error) {
            result.invalid.push(address);
        }
    }
    
    return result;
}
