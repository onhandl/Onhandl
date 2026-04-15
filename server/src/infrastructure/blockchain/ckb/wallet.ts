/**
 * wallet.ts
 * CKB Wallet - Generate private key and derive address
 * Uses @ckb-lumos/lumos on testnet (Aggron)
 */

import { hd, config, helpers } from "@ckb-lumos/lumos";
import * as crypto from "crypto";
import { TESTNET } from "@ckb-lumos/lumos/config";

// ─── Config ────────────────────────────────────────────────────────────────────
// Use AGGRON4 for testnet. Swap to LINA for mainnet.
config.initializeConfig(TESTNET);

// ─── Generate a random private key (without HD mnemonic) ───────────────────────
export function generatePrivateKey(): string {
    // 32 random bytes → 64-char hex string with 0x prefix
    return "0x" + crypto.randomBytes(32).toString("hex");
}

function generatePublicKey(privateKey: string): string {
    // Blake160 hash of the compressed public key → used as lock args
    const args = hd.key.privateKeyToBlake160(privateKey);
    return args;
}



export const getTestnet = () => {
    config.initializeConfig(TESTNET);
    return "ckb-testnet";
}

// ─── Derive CKB address from a private key ─────────────────────────────────────
export function getAddressFromPrivateKey(privateKey: string): string {
    // Blake160 hash of the compressed public key → used as lock args
    const args = hd.key.privateKeyToBlake160(privateKey);

    const template = TESTNET.SCRIPTS["SECP256K1_BLAKE160"]!;
    const lockScript = {
        codeHash: template.CODE_HASH,
        hashType: template.HASH_TYPE,
        args,
    };

    return helpers.encodeToAddress(lockScript);
}
