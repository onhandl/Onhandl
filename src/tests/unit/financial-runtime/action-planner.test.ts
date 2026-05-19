import { describe, expect, it } from 'vitest';
import { ActionPlanner } from '../../../core/financial-runtime/ActionPlanners/ActionPlanner';
import type { PolicyAction, RuntimeEvent } from '../../../core/financial-runtime/types';

describe('ActionPlanner', () => {
  it('splits ALLOCATE_FUNDS into TRANSFER_FUNDS and RETAIN_FUNDS with correct amounts', () => {
    const planner = new ActionPlanner();

    const event: RuntimeEvent<'FUNDS.RECEIVED'> = {
      id: 'evt_1',
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

    const actions: PolicyAction[] = [
      {
        type: 'ALLOCATE_FUNDS',
        config: {
          allocations: [
            {
              kind: 'transfer',
              percentage: 40,
              to: 'addr_1',
              asset: 'CKB',
              chain: 'CKB',
            },
            {
              kind: 'retain',
              percentage: 60,
            },
          ],
        },
      },
    ];

    const planned = planner.plan(event, actions);

    expect(planned).toHaveLength(2);
    expect(planned[0].type).toBe('TRANSFER_FUNDS');
    expect(planned[1].type).toBe('RETAIN_FUNDS');

    if (planned[0].type === 'TRANSFER_FUNDS') {
      expect(planned[0].config.amount).toBe('400.00000000');
    }

    if (planned[1].type === 'RETAIN_FUNDS') {
      expect(planned[1].config.amount).toBe('600.00000000');
    }
  });
});
