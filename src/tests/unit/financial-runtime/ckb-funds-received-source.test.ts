import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CkbFundsReceivedSource } from '../../../core/financial-runtime/EventSources/blockchain/ckb/CkbFundsReceivedSource';
import { FinancialAgentRepository } from '../../../modules/financial-agents/financial-repositories/financial-agent.repository';
import { FinancialAgentStateRepository } from '../../../modules/financial-agents/financial-repositories/financial-agent-state.repository';
import { MonitorTransactionsTool } from '../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_indexer_monitor_transactions';
import { eventBus } from '../../../core/financial-runtime/eventBus';
import { IdempotencyService } from '../../../infrastructure/idempotency/idempotency.service';

describe('CkbFundsReceivedSource', () => {
    beforeEach(() => {
        vi.spyOn(eventBus, 'emit').mockImplementation(() => true);
        vi.spyOn(FinancialAgentStateRepository, 'save').mockResolvedValue(true as any);

        vi.spyOn(IdempotencyService, 'acquire').mockResolvedValue({ acquired: true });
        vi.spyOn(IdempotencyService, 'complete').mockResolvedValue(undefined);
        vi.spyOn(IdempotencyService, 'fail').mockResolvedValue(undefined);

        // Turn off console output inside test bounds
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('emits FUNDS.RECEIVED for new transactions, passes idempotency, and updates the block cursor', async () => {
        const source = new CkbFundsReceivedSource();

        const mockAgent = {
            _id: 'agent_1',
            workspaceId: 'workspace_1',
            networkConfigs: [
                {
                    network: 'CKB',
                    enabled: true,
                    wallet: { address: 'ckb1qqmockaddress' }
                }
            ]
        } as any;

        vi.spyOn(FinancialAgentRepository, 'findActiveWithNetwork').mockResolvedValue([mockAgent]);

        const mockState = {
            agentId: 'agent_1',
            metadata: {
                watchers: {
                    ckb: {
                        nextFromBlock: '0x1000'
                    }
                }
            }
        } as any;
        vi.spyOn(FinancialAgentStateRepository, 'findByAgentId').mockResolvedValue(mockState);

        vi.spyOn(MonitorTransactionsTool, 'execute').mockResolvedValue({
            address: 'ckb1qqmockaddress',
            scannedRange: { from: '0x1000', to: '0x100a' },
            newTransactionCount: 1,
            transactions: [
                {
                    txHash: '0xtesttxhash',
                    blockNumber: '0x100a',
                    timestamp: new Date(),
                    amountCkb: '100.5',
                    toAddress: 'ckb1qqmockaddress'
                }
            ],
            nextFromBlock: '0x100b'
        } as any);

        await source.pollOnce();

        expect(IdempotencyService.acquire).toHaveBeenCalledWith(expect.objectContaining({
            scope: 'financial-runtime:event-source',
            key: 'FUNDS.RECEIVED:CKB:workspace_1:agent_1:0xtesttxhash'
        }));

        expect(eventBus.emit).toHaveBeenCalledWith('FUNDS.RECEIVED', expect.objectContaining({
            agentId: 'agent_1',
            workspaceId: 'workspace_1',
            amount: '100.5',
            asset: 'CKB',
            chain: 'CKB',
            recipientAddress: 'ckb1qqmockaddress',
            txHash: '0xtesttxhash'
        }));

        expect(IdempotencyService.complete).toHaveBeenCalled();

        // Verify state was saved with the new cursor
        expect(FinancialAgentStateRepository.save).toHaveBeenCalled();
        expect(mockState.metadata.watchers.ckb.nextFromBlock).toBe('0x100b');
    });

    it('does not emit FUNDS.RECEIVED and updates cursor if acquire returns false', async () => {
        const source = new CkbFundsReceivedSource();

        const mockAgent = { _id: 'a', workspaceId: 'w', networkConfigs: [{ network: 'CKB', enabled: true, wallet: { address: 'ckbaddr' } }] } as any;
        vi.spyOn(FinancialAgentRepository, 'findActiveWithNetwork').mockResolvedValue([mockAgent]);

        const mockState = { metadata: {} } as any;
        vi.spyOn(FinancialAgentStateRepository, 'findByAgentId').mockResolvedValue(mockState);

        vi.spyOn(MonitorTransactionsTool, 'execute').mockResolvedValue({
            address: 'ckbaddr',
            scannedRange: { from: '0x0', to: '0x1' },
            newTransactionCount: 1,
            transactions: [{ txHash: '0xdupetx', amountCkb: '10' } as any],
            nextFromBlock: '0x2'
        } as any);

        vi.spyOn(IdempotencyService, 'acquire').mockResolvedValue({ acquired: false, status: 'completed' });

        await source.pollOnce();

        expect(IdempotencyService.acquire).toHaveBeenCalled();
        expect(eventBus.emit).not.toHaveBeenCalled(); // Duplicate! Skip emit.
        expect(mockState.metadata.watchers.ckb.nextFromBlock).toBe('0x2'); // Cursor still updates!
    });

    it('calls fail if processing throws', async () => {
        const source = new CkbFundsReceivedSource();

        const mockAgent = { _id: 'a', workspaceId: 'w', networkConfigs: [{ network: 'CKB', enabled: true, wallet: { address: 'ckbaddr' } }] } as any;
        vi.spyOn(FinancialAgentRepository, 'findActiveWithNetwork').mockResolvedValue([mockAgent]);

        const mockState = { metadata: {} } as any;
        vi.spyOn(FinancialAgentStateRepository, 'findByAgentId').mockResolvedValue(mockState);

        vi.spyOn(MonitorTransactionsTool, 'execute').mockResolvedValue({
            address: 'ckbaddr',
            scannedRange: { from: '0x0', to: '0x1' },
            newTransactionCount: 1,
            transactions: [{ txHash: '0xerrortx', amountCkb: '10' } as any],
            nextFromBlock: '0x2'
        } as any);

        vi.spyOn(eventBus, 'emit').mockImplementation(() => { throw new Error('Emit boom'); });

        await source.pollOnce();

        expect(IdempotencyService.acquire).toHaveBeenCalled();
        expect(IdempotencyService.fail).toHaveBeenCalledWith(expect.objectContaining({ error: 'Emit boom' }));
    });

    it('skips agent if no CKB config is enabled', async () => {
        const source = new CkbFundsReceivedSource();

        const mockAgent = {
            _id: 'agent_no_ckb',
            networkConfigs: []
        } as any;

        vi.spyOn(FinancialAgentRepository, 'findActiveWithNetwork').mockResolvedValue([mockAgent]);

        const executeSpy = vi.spyOn(MonitorTransactionsTool, 'execute');

        await source.pollOnce();

        expect(executeSpy).not.toHaveBeenCalled();
    });

    it('gracefully handles and logs errors for a single agent without stopping the loop', async () => {
        const source = new CkbFundsReceivedSource();

        // 1. Mock repository to return two active CKB agents
        const mockAgent1 = {
            _id: 'agent_1_fails',
            workspaceId: 'workspace_1',
            networkConfigs: [{ network: 'CKB', enabled: true, wallet: { address: 'ckbFAIL' } }]
        } as any;
        const mockAgent2 = {
            _id: 'agent_2_succeeds',
            workspaceId: 'workspace_1',
            networkConfigs: [{ network: 'CKB', enabled: true, wallet: { address: 'ckbSUCCEED' } }]
        } as any;

        vi.spyOn(FinancialAgentRepository, 'findActiveWithNetwork').mockResolvedValue([mockAgent1, mockAgent2]);

        const mockState1 = { metadata: {} } as any;
        const mockState2 = { metadata: {} } as any;

        vi.spyOn(FinancialAgentStateRepository, 'findByAgentId')
            .mockResolvedValueOnce(mockState1)
            .mockResolvedValueOnce(mockState2);

        const executeSpy = vi.spyOn(MonitorTransactionsTool, 'execute')
            .mockRejectedValueOnce(new Error('simulated network failure'))
            .mockResolvedValueOnce({
                address: 'ckbSUCCEED',
                scannedRange: { from: '0x0', to: '0x1' },
                newTransactionCount: 0,
                transactions: [],
                nextFromBlock: '0x2'
            } as any);

        await source.pollOnce();

        expect(executeSpy).toHaveBeenCalledTimes(2);
        // Error should be logged but loop continued
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to poll agent agent_1_fails'),
            expect.any(Error)
        );
    });
});
