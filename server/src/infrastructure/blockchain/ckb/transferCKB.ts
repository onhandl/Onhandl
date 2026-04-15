/**
 * transfer.ts
 * CKB Wallet - Transfer CKB to another address
 *
 * Usage:
 *   npx ts-node transfer.ts \
 *     --privateKey 0xYOUR_PRIVATE_KEY \
 *     --to ckt1qRECIPIENT_ADDRESS \
 *     --amount 100
 *
 * Amount is in CKB (not Shannons). Minimum is 61 CKB.
 */

import {
  BI,
  hd,
  config,
  helpers,
  RPC,
  Indexer,
  commons,
  Address,
  HexString,
} from "@ckb-lumos/lumos";
import { TESTNET } from "@ckb-lumos/lumos/config";

// ─── Config ────────────────────────────────────────────────────────────────────
config.initializeConfig(TESTNET);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

// ─── Derive address from private key ───────────────────────────────────────────
export function getAddressFromPrivateKey(privateKey: string): string {
  const args = hd.key.privateKeyToBlake160(privateKey);
  const template = TESTNET.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args,
  };
  return helpers.encodeToAddress(lockScript);
}

// ─── Transfer CKB ──────────────────────────────────────────────────────────────
/**
 * @param from        Sender's CKB address
 * @param to          Recipient's CKB address
 * @param ckbAmount   Amount in CKB (e.g. 100 means 100 CKB)
 * @param privateKey  Sender's private key (hex string, 0x-prefixed)
 * @returns           Transaction hash
 */
export async function transferCKB(
  from: Address,
  to: Address,
  ckbAmount: number,
  privateKey: HexString
): Promise<string> {
  // Convert CKB → Shannon (1 CKB = 10^8 Shannon)
  const capacityInShannons = BigInt(Math.round(ckbAmount * 10 ** 8));

  // 1. Build skeleton
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  // 2. Add transfer output
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [from],
    to,
    capacityInShannons
  );

  // 3. Pay miner fee at 1000 shannons/KB
  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [from],
    1000
  );

  // 4. Prepare signing entries
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  // 5. Sign
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  if (!message) throw new Error("No signing entry found in transaction skeleton");

  const sig = hd.key.signRecoverable(message, privateKey);

  // 6. Seal & broadcast
  const tx = helpers.sealTransaction(txSkeleton, [sig]);
  const txHash = await rpc.sendTransaction(tx, "passthrough");

  return txHash;
}


