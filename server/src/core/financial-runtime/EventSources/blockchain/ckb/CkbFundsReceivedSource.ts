import { IFinancialAgent } from '../../../../../infrastructure/database/models/FinancialAgent';
import { FinancialAgentRepository } from '../../../../../modules/financial-agents/financial-repositories/financial-agent.repository';
import { FinancialAgentStateRepository } from '../../../../../modules/financial-agents/financial-repositories/financial-agent-state.repository';
import { MonitorTransactionsTool } from '../../../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_indexer_monitor_transactions';
import { eventBus } from '../../../../../infrastructure/events/eventBus';
import { IdempotencyService, buildIdempotencyKey } from '../../../../../infrastructure/idempotency/idempotency.service';

export class CkbFundsReceivedSource {
    /**
     * One poll cycle: find all active CKB agents and scan for new incoming transactions.
     * Call this repeatedly (e.g. from a setInterval or Agenda job) to keep the event source alive.
     */
    async pollOnce(): Promise<void> {
        const agents = await FinancialAgentRepository.findActiveWithNetwork('CKB');

        for (const agent of agents) {
            try {
                await this.pollAgent(agent);

            } catch (error) {
                console.error(
                    `[CkbFundsReceivedSource] Failed to poll agent ${agent._id}:`,
                    error
                );
            }
        }
    }

    private async pollAgent(agent: IFinancialAgent): Promise<void> {
        // Find the active CKB network config
        const ckbConfig = agent.networkConfigs.find(
            (nc) => nc.network === 'CKB' && nc.enabled
        );
        if (!ckbConfig) return;

        const walletAddress = ckbConfig.wallet.address;
        if (!walletAddress) return;

        // Load agent state — create a minimal one if none exists yet
        let state = await FinancialAgentStateRepository.findByAgentId(String(agent._id));
        if (!state) {
            if (!agent.workspaceId) {
                console.warn(`[CkbFundsReceivedSource] Skipping agent ${agent._id}: missing workspaceId and no state exists to recover it.`);
                return;
            }
            state = await FinancialAgentStateRepository.create({
                agentId: agent._id,
                workspaceId: agent.workspaceId,
                balances: [],
                counters: { monthlySpend: '0', totalReceived: '0' },
                pendingApprovalIds: [],
                metadata: {},
            });
            console.log(`[CkbFundsReceivedSource] Created initial state for agent ${agent._id}`);
        }

        // Read persisted cursor (undefined on first run — tool will use current chain tip)
        const existingMeta = (state.metadata ?? {}) as Record<string, any>;
        const existingWatchers = (existingMeta.watchers ?? {}) as Record<string, any>;
        const existingCkbWatcher = (existingWatchers.ckb ?? {}) as Record<string, any>;
        const fromBlock: string | undefined = existingCkbWatcher.nextFromBlock;

        // One poll cycle via the existing MonitorTransactionsTool
        const result = await MonitorTransactionsTool.execute({
            address: walletAddress,
            fromBlock,
            limit: 50,
        });
        console.log('[CkbFundsReceivedSource] scanning:', result.scannedRange, '| found:', result.newTransactionCount);

        // Emit FUNDS.RECEIVED for every new incoming transaction
        let emittedCount = 0;
        for (const tx of result.transactions) {
            const key = buildIdempotencyKey([
                'FUNDS.RECEIVED',
                'CKB',
                String(agent.workspaceId),
                String(agent._id),
                tx.txHash,
            ]);

            const acquired = await IdempotencyService.acquire({
                scope: 'financial-runtime:event-source',
                key,
                metadata: {
                    chain: 'CKB',
                    txHash: tx.txHash,
                    agentId: String(agent._id),
                    workspaceId: String(agent.workspaceId),
                    source: 'CkbFundsReceivedSource',
                },
                lockMs: 60_000,
            });

            if (!acquired.acquired) {
                console.log(`[CkbFundsReceivedSource] Skipping duplicate tx ${tx.txHash}`);
                continue;
            }

            try {
                eventBus.emit('FUNDS.RECEIVED', {
                    workspaceId: String(agent.workspaceId),
                    agentId: String(agent._id),
                    amount: tx.amountCkb,
                    asset: 'CKB',
                    chain: 'CKB',
                    recipientAddress: tx.toAddress,
                    payerAddress: tx.fromAddress || undefined,
                    txHash: tx.txHash,
                });

                await IdempotencyService.complete({
                    scope: 'financial-runtime:event-source',
                    key,
                    metadata: {
                        emittedEvent: 'FUNDS.RECEIVED',
                    },
                });
                emittedCount++;
            } catch (error: any) {
                await IdempotencyService.fail({
                    scope: 'financial-runtime:event-source',
                    key,
                    error: error?.message || String(error),
                });
                throw error;
            }
        }

        // Persist the new cursor so we don't re-scan the same block range on restart
        state.metadata = {
            ...existingMeta,
            watchers: {
                ...existingWatchers,
                ckb: {
                    ...existingCkbWatcher,
                    nextFromBlock: result.nextFromBlock,
                    lastScannedAt: new Date().toISOString(),
                },
            },
        };

        await FinancialAgentStateRepository.save(state);

        if (emittedCount > 0) {
            console.log(
                `[CkbFundsReceivedSource] Agent ${agent._id}: emitted ${emittedCount} FUNDS.RECEIVED event(s). Next cursor: ${result.nextFromBlock}`
            );
        }
    }
}
