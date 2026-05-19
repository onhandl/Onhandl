/**
 * CKB balance sync adapter.
 * Responsible for: call the existing ckb_get_balance tool → format result → return AssetBalance[]
 * Uses the registered tool so logic is not duplicated.
 */
import { AssetBalance } from '../../../../infrastructure/database/models/FinancialAgentState';
import { getBalance } from '../../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_get_balance';

const MOCK_USD_PRICE = 0.01215; // Replace later with market price provider

export async function syncCkbBalances(walletAddress: string): Promise<AssetBalance[]> {
    const ckbDisplay = await getBalance(walletAddress);
    const usdValue = (parseFloat(ckbDisplay) * MOCK_USD_PRICE).toFixed(2);

    return [
        {
            asset: 'CKB',
            rawAmount: ckbDisplay, // ckb_get_balance already returns fixed-point string
            displayAmount: ckbDisplay,
            usdValue,
            usdPrice: MOCK_USD_PRICE.toString(),
            lastSyncedAt: new Date(),
        },
    ];
}
