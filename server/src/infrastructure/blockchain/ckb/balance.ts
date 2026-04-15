/**
 * balance.ts
 * CKB Wallet - Check CKB balance
 */

import { BI, RPC, Indexer, config, helpers, hd } from "@ckb-lumos/lumos";
import { TESTNET } from "@ckb-lumos/lumos/config";

// ─── Config ────────────────────────────────────────────────────────────────────
config.initializeConfig(TESTNET);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

// ─── Derive address from private key ───────────────────────────────────────────
function getAddressFromPrivateKey(privateKey: string): string {
    const args = hd.key.privateKeyToBlake160(privateKey);
    const template = TESTNET.SCRIPTS["SECP256K1_BLAKE160"]!;
    const lockScript = {
        codeHash: template.CODE_HASH,
        hashType: template.HASH_TYPE,
        args,
    };
    return helpers.encodeToAddress(lockScript);
}

// ─── Get total CKB capacity (in Shannons) ──────────────────────────────────────
export async function getCapacities(address: string): Promise<BI> {
    const collector = indexer.collector({
        lock: helpers.parseAddress(address),
    });

    let capacities = BI.from(0);
    for await (const cell of collector.collect()) {
        capacities = capacities.add(cell.cellOutput.capacity);
    }

    return capacities;
}

// ─── Format Shannon → CKB ──────────────────────────────────────────────────────
export function formatCKB(shannons: BI): string {
    // 1 CKB = 10^8 Shannons
    const ckb = shannons.toBigInt();
    const whole = ckb / BigInt(10 ** 8);
    const remainder = ckb % BigInt(10 ** 8);
    const decimals = remainder.toString().padStart(8, "0").replace(/0+$/, "") || "0";
    return `${whole}.${decimals}`;
}
