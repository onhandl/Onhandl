import { FinancialAgentState, AssetBalance } from '../../../infrastructure/database/models/FinancialAgentState';
import { FinancialAgent, AgentNetworkConfig } from '../../../infrastructure/database/models/FinancialAgent';
import mongoose from 'mongoose';

/**
 * Balance sync adapter type.
 * Each network registers one of these to handle its own balance fetching.
 */
type NetworkBalanceAdapter = (walletAddress: string) => Promise<AssetBalance[]>;

type AdapterRegistry = Record<string, NetworkBalanceAdapter>;

// ── Adapter registry (populated at startup via registerBalanceAdapter) ─────────

const adapters: AdapterRegistry = {};

export function registerBalanceAdapter(network: string, adapter: NetworkBalanceAdapter) {
    adapters[network] = adapter;
}

// ── Core sync logic ────────────────────────────────────────────────────────────

async function runSync(config: AgentNetworkConfig): Promise<AssetBalance[]> {
    const adapter = adapters[config.network];
    if (!adapter || !config.wallet?.address) return [];
    return adapter(config.wallet.address);
}

export async function syncAgentBalances(agentId: string, fallbackWorkspaceId?: string) {
    const agent = await FinancialAgent.findById(agentId);
    if (!agent) throw new Error('Agent not found');

    const allFreshBalances: AssetBalance[] = [];

    for (const config of agent.networkConfigs) {
        if (!config.enabled) continue;
        try {
            const balances = await runSync(config);
            allFreshBalances.push(...balances);
        } catch (error) {
            console.error(`Failed to sync balances for network ${config.network}:`, error);
        }
    }

    let state = await FinancialAgentState.findOne({ agentId });
    const obj = new mongoose.Types.ObjectId(fallbackWorkspaceId);
    if (!state) {
        const workspaceId = agent.workspaceId || (fallbackWorkspaceId ? obj : undefined);

        if (!workspaceId) {
            throw new Error(`Cannot initialize state for agent ${agentId}: missing workspaceId and no fallback provided`);
        }

        state = new FinancialAgentState({
            agentId: agent._id,
            workspaceId: workspaceId,
            balances: [],
            counters: { monthlySpend: '0', totalReceived: '0' },
            pendingApprovalIds: [],
            metadata: {}
        });
    }

    for (const fresh of allFreshBalances) {
        const index = state.balances.findIndex((b: AssetBalance) => b.asset === fresh.asset);
        if (index >= 0) {
            state.balances[index] = { ...state.balances[index], ...fresh };
        } else {
            state.balances.push(fresh);
        }
    }

    state.lastFullSyncAt = new Date();
    state.totalUsdValue = state.balances.reduce((sum: number, b: AssetBalance) => sum + parseFloat(b.usdValue || '0'), 0).toFixed(2);
    state.totalNativeAmount = state.balances.reduce((sum: number, b: AssetBalance) => sum + parseFloat(b.displayAmount || '0'), 0).toFixed(4);

    await state.save();
    return state;
}

export async function getAgentBalanceSummary(agentId: string, fallbackWorkspaceId?: string) {
    let state = await FinancialAgentState.findOne({ agentId });

    if (!state) {
        state = await syncAgentBalances(agentId, fallbackWorkspaceId);
    } else {
        const STALE_THRESHOLD_MS = 30_000;
        const isStale = !state.lastFullSyncAt || (Date.now() - state.lastFullSyncAt.getTime() > STALE_THRESHOLD_MS);
        if (isStale) {
            await syncAgentBalances(agentId, fallbackWorkspaceId);
            state = await FinancialAgentState.findOne({ agentId });
            if (!state) throw new Error('Agent state missing after sync');
        }
    }

    return {
        agentId,
        assets: state.balances.map((b: AssetBalance) => ({
            asset: b.asset,
            amount: b.displayAmount,
            usdValue: b.usdValue,
        })),
        totals: {
            usd: parseFloat(state.totalUsdValue || '0').toFixed(2),
            native: parseFloat(state.totalNativeAmount || '0').toFixed(4),
        },
        lastSyncedAt: state.lastFullSyncAt,
    };
}
