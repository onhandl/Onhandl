/**
 * WalletSubOrchestrator.ts
 * Handles all wallet-related intents: balance checks, address lookups, transfers.
 * Acts as a specialized sub-orchestrator for financial agents.
 */

import { getCapacities, formatCKB } from '../../../infrastructure/blockchain/ckb/balance';
import { transferCKB, getAddressFromPrivateKey } from '../../../infrastructure/blockchain/ckb/transferCKB';

export interface WalletContext {
    network: string;
    walletAddress?: string;
    publicKey?: string;
    privateKey?: string;
    walletType?: 'managed' | 'externally_owned';
}

type WalletIntent = 'balance' | 'address' | 'transfer' | 'unknown';

interface ParsedWalletIntent {
    intent: WalletIntent;
    targetAddress?: string; // address to check / send to
    amount?: number;        // ckb amount for transfer
}

// In-memory pending transfer store per session (for approval flow)
const pendingTransfers: Map<string, { from: string; to: string; amount: number }> = new Map();

function setPendingTransfer(sessionId: string, data: { from: string; to: string; amount: number }) {
    pendingTransfers.set(sessionId, data);
}

function getPendingTransfer(sessionId: string) {
    return pendingTransfers.get(sessionId);
}

function clearPendingTransfer(sessionId: string) {
    pendingTransfers.delete(sessionId);
}

/**
 * Parse user intent from natural language.
 * IMPORTANT: transfer/send must be checked BEFORE address to avoid 'to this address' false-matching.
 */
export function parseWalletIntent(prompt: string): ParsedWalletIntent {
    const lower = prompt.toLowerCase();

    // Detect CKB addresses in the message
    const ckbRegex = /(ckt|ckb)1[0-9a-z]{38,}/gi;
    const addresses = prompt.match(ckbRegex) || [];

    // Detect amounts (e.g. "send 100 ckb", "transfer 750 ckb")
    const amountMatch = lower.match(/(?:send|transfer)\s+([\d.]+)\s*(?:ckb)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

    // ── ORDER MATTERS: transfer/send before address ──
    if (lower.includes('send') || lower.includes('transfer')) {
        return { intent: 'transfer', targetAddress: addresses[0], amount };
    }
    if (lower.includes('balance') || lower.includes('how much') || lower.includes('funds')) {
        return { intent: 'balance', targetAddress: addresses[0] };
    }
    if (lower.includes('address') || lower.includes('wallet address') || lower.includes('my address')) {
        return { intent: 'address' };
    }

    return { intent: 'unknown', targetAddress: addresses[0] };
}

/**
 * Execute balance check for a given address
 */
async function executeBalanceCheck(address: string): Promise<{ address: string; balance: string }> {
    const capacities = await getCapacities(address);
    return {
        address,
        balance: `${formatCKB(capacities)} CKB`
    };
}

/**
 * Execute CKB transfer -- requires explicit user approval first
 */
async function executeTransfer(
    from: string,
    to: string,
    amount: number,
    privateKey: string
): Promise<{ txHash: string }> {
    const txHash = await transferCKB(from, to, amount, privateKey);
    return { txHash };
}

/**
 * Main wallet sub-orchestrator handler
 */
export async function handleWalletIntent(
    parsed: ParsedWalletIntent,
    agentWallets: WalletContext[],
    userApproved: boolean = false,
    sessionId?: string
): Promise<{ message: string; data?: any; requiresApproval?: boolean }> {
    const primaryWallet = agentWallets.find(w => w.walletAddress) || agentWallets[0];

    switch (parsed.intent) {
        case 'address': {
            if (!primaryWallet?.walletAddress) {
                return { message: 'No wallet address is configured for this agent.' };
            }
            return {
                message: `Your CKB wallet address is:\n\`\`\`\n${primaryWallet.walletAddress}\n\`\`\`\nNetwork: ${primaryWallet.network || 'CKB Testnet'}`,
                data: { address: primaryWallet.walletAddress }
            };
        }

        case 'balance': {
            const addressToCheck = parsed.targetAddress || primaryWallet?.walletAddress;
            if (!addressToCheck) {
                return { message: 'No wallet address available. Please provide a CKB address to check.' };
            }
            try {
                const result = await executeBalanceCheck(addressToCheck);
                return {
                    message: `Balance for \`${addressToCheck.slice(0, 20)}...${addressToCheck.slice(-8)}\`:\n**${result.balance}**`,
                    data: result
                };
            } catch (e: any) {
                return { message: `Could not fetch balance: ${e.message}` };
            }
        }

        case 'transfer': {
            const from = primaryWallet?.walletAddress;
            const privateKey = primaryWallet?.privateKey;
            const to = parsed.targetAddress;
            const amount = parsed.amount;

            // If user is approving, retrieve the pending transfer from session
            if (userApproved && sessionId) {
                const pending = getPendingTransfer(sessionId);
                const resolvedFrom = pending?.from || from;
                const resolvedTo = pending?.to || to;
                const resolvedAmount = pending?.amount || amount;

                if (!resolvedFrom || !privateKey) {
                    return { message: '❌ No managed wallet found for this agent. Cannot send.' };
                }
                if (!resolvedTo) {
                    return { message: '❌ No destination address. Please start the transfer command again.' };
                }
                if (!resolvedAmount || resolvedAmount <= 0) {
                    return { message: '❌ No valid amount. Please start the transfer command again.' };
                }

                clearPendingTransfer(sessionId);
                try {
                    const result = await executeTransfer(resolvedFrom, resolvedTo, resolvedAmount, privateKey);
                    const explorerUrl = `https://testnet.explorer.nervos.org/transaction/${result.txHash}`;
                    return {
                        message: [
                            '✅ **Transfer Completed Successfully!**',
                            '',
                            `**Amount:** ${resolvedAmount} CKB`,
                            `**To:** \`${resolvedTo}\``,
                            '',
                            `🔗 [View on Nervos Explorer](${explorerUrl})`,
                            '\`\`\`',
                            result.txHash,
                            '\`\`\`'
                        ].join('\n'),
                        data: { txHash: result.txHash, explorerUrl }
                    };
                } catch (e: any) {
                    return { message: `❌ Transfer failed: ${e.message}` };
                }
            }

            // Not yet approved — show confirmation prompt and store pending transfer
            if (!from || !to) {
                return { message: '❌ Please specify both a destination address and amount. Example: "send 100 CKB to ckt1q..."' };
            }
            if (sessionId) {
                setPendingTransfer(sessionId, { from, to, amount: amount ?? 0 });
            }
            return {
                message: [
                    '⚠️ **Transfer Confirmation Required**',
                    '',
                    `| Field | Value |`,
                    `|-------|-------|`,
                    `| From | \`${from.slice(0, 20)}...${from.slice(-8)}\` |`,
                    `| To | \`${to.slice(0, 20)}...${to.slice(-8)}\` |`,
                    `| Amount | **${amount ?? '?'} CKB** |`,
                    '',
                    'Reply **"I approve this transaction"** to execute the transfer.'
                ].join('\n'),
                requiresApproval: true,
                data: { from, to, amount }
            };
        }

        default:
            return { message: '' }; // Let the main LLM handle unknown intents
    }
}
