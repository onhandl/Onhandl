import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionExecutor } from '../../../core/financial-runtime/ActionExecutors';
import { eventBus } from '../../../infrastructure/events/eventBus';
import { TransferTool } from '../../../infrastructure/blockchain/ckb';
import type { ExecutableAction, RuntimeEvent } from '../../../core/financial-runtime/types';

describe('ActionExecutor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits transfer lifecycle and transfer-requested events for TRANSFER_FUNDS', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const executor = new ActionExecutor();

    // Mock TransferTool execution
    vi.spyOn(TransferTool, 'execute').mockResolvedValue('0xmock_tx_hash');

    const event: RuntimeEvent<'FUNDS.RECEIVED'> = {
      id: 'evt_transfer',
      type: 'FUNDS.RECEIVED',
      workspaceId: 'workspace_1',
      source: 'test',
      createdAt: Date.now(),
      payload: {
        amount: '1000',
        asset: 'CKB',
        chain: 'CKB',
        recipientAddress: 'recipient_1',
      },
    };

    const action: ExecutableAction = {
      type: 'TRANSFER_FUNDS',
      config: {
        to: 'addr_1',
        amount: '400.00000000',
        asset: 'CKB',
        chain: 'CKB',
      },
    };

    const mockAgent = {
      _id: 'agent_1',
      networkConfigs: [{
        network: 'CKB',
        wallet: { address: 'mock_addr', privateKey: 'mock_key' }
      }]
    } as any;

    await executor.execute(mockAgent, action, event);

    expect(emitSpy).toHaveBeenCalledWith(
      'FINANCIAL_ACTION.STARTED',
      expect.objectContaining({
        agentId: 'agent_1',
        eventId: 'evt_transfer',
        workspaceId: 'workspace_1',
        type: 'TRANSFER_FUNDS',
        createdAt: expect.any(Number),
      })
    );

    expect(emitSpy).toHaveBeenCalledWith(
      'FUNDS.TRANSFER_REQUESTED',
      expect.objectContaining({
        agentId: 'agent_1',
        workspaceId: 'workspace_1',
        eventId: 'evt_transfer',
        to: 'addr_1',
        amount: '400.00000000',
        asset: 'CKB',
        chain: 'CKB',
        createdAt: expect.any(Number),
      })
    );

    expect(emitSpy).toHaveBeenCalledWith(
      'FINANCIAL_ACTION.EXECUTED',
      expect.objectContaining({
        agentId: 'agent_1',
        eventId: 'evt_transfer',
        workspaceId: 'workspace_1',
        type: 'TRANSFER_FUNDS',
      })
    );

    expect(emitSpy).toHaveBeenCalledWith(
      'FINANCIAL_ACTION.COMPLETED',
      expect.objectContaining({
        agentId: 'agent_1',
        eventId: 'evt_transfer',
        workspaceId: 'workspace_1',
        type: 'TRANSFER_FUNDS',
        createdAt: expect.any(Number),
      })
    );
  });

  it('emits retain lifecycle and retained events for RETAIN_FUNDS', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const executor = new ActionExecutor();

    const event: RuntimeEvent<'FUNDS.RECEIVED'> = {
      id: 'evt_retain',
      type: 'FUNDS.RECEIVED',
      workspaceId: 'workspace_1',
      source: 'test',
      createdAt: Date.now(),
      payload: {
        amount: '1000',
        asset: 'CKB',
        chain: 'CKB',
        recipientAddress: 'recipient_1',
      },
    };

    const action: ExecutableAction = {
      type: 'RETAIN_FUNDS',
      config: {
        amount: '600.00000000',
      },
    };

    await executor.execute('agent_1', action, event);

    expect(emitSpy).toHaveBeenCalledWith(
      'FINANCIAL_ACTION.STARTED',
      expect.objectContaining({
        agentId: 'agent_1',
        eventId: 'evt_retain',
        workspaceId: 'workspace_1',
        type: 'RETAIN_FUNDS',
        createdAt: expect.any(Number),
      })
    );

    expect(emitSpy).toHaveBeenCalledWith(
      'FUNDS.RETAINED',
      expect.objectContaining({
        agentId: 'agent_1',
        workspaceId: 'workspace_1',
        eventId: 'evt_retain',
        amount: '600.00000000',
        createdAt: expect.any(Number),
      })
    );

    expect(emitSpy).toHaveBeenCalledWith(
      'FINANCIAL_ACTION.COMPLETED',
      expect.objectContaining({
        agentId: 'agent_1',
        eventId: 'evt_retain',
        workspaceId: 'workspace_1',
        type: 'RETAIN_FUNDS',
        createdAt: expect.any(Number),
      })
    );
  });
});
