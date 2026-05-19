import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../../../modules/ai/ai.service';
import { FinancialAgentDraftingService } from '../../../modules/financial-agents/financial-services.ts/financial-agent-drafting.service';

vi.mock('../../../modules/ai/ai.service', () => ({
  AiService: {
    generateCompletion: vi.fn(),
  },
}));

const RECIPIENT =
  'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqd4ekfpd2dkelkjjzma7y2yjfyhkfnjkgg0dsdq8';

function buildRetainOnlyDraft() {
  return {
    agent: {
      name: 'Treasury Account',
      description: 'Retain incoming funds in the managed wallet.',
      subscribedEvents: ['FUNDS.RECEIVED'],
      permissionConfig: {
        allowedChains: ['CKB'],
        allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
      },
      approvalConfig: {},
      networkConfigs: [
        {
          network: 'CKB',
          enabled: true,
          allowedAssets: ['CKB'],
          allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
          recipientPolicy: 'all',
          allowedRecipients: [],
        },
      ],
    },
    policies: [
      {
        trigger: 'FUNDS.RECEIVED',
        conditions: [],
        actions: [
          {
            type: 'ALLOCATE_FUNDS',
            config: {
              allocations: [{ kind: 'retain', percentage: 100, label: 'Retain all funds' }],
            },
          },
        ],
        priority: 1,
      },
    ],
    assumptions: [],
  };
}

function buildSplitDraft(address: string) {
  return {
    agent: {
      name: 'Treasury Account',
      description: 'Distribute incoming funds according to the user request.',
      subscribedEvents: ['FUNDS.RECEIVED'],
      permissionConfig: {
        allowedChains: ['CKB'],
        allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
      },
      approvalConfig: {},
      networkConfigs: [
        {
          network: 'CKB',
          enabled: true,
          allowedAssets: ['CKB'],
          allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
          recipientPolicy: 'all',
          allowedRecipients: [],
        },
      ],
    },
    policies: [
      {
        trigger: 'FUNDS.RECEIVED',
        conditions: [],
        actions: [
          {
            type: 'ALLOCATE_FUNDS',
            config: {
              allocations: [
                {
                  kind: 'transfer',
                  percentage: 40,
                  to: address,
                  asset: 'CKB',
                  chain: 'CKB',
                },
                { kind: 'retain', percentage: 60, label: 'Retain remainder' },
              ],
            },
          },
        ],
        priority: 1,
      },
    ],
    assumptions: [],
  };
}

function buildIncompleteSplitDraft(address: string) {
  return {
    agent: {
      description: 'Send part of incoming funds to the supplied recipient.',
    },
    policies: [
      {
        actions: [
          {
            type: 'ALLOCATE_FUNDS',
            config: {
              allocations: [
                {
                  kind: 'transfer',
                  percentage: 50,
                  to: address,
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('FinancialAgentDraftingService.draftFromPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries when an explicit recipient address is omitted and then normalizes the recipient controls', async () => {
    vi.mocked(AiService.generateCompletion)
      .mockResolvedValueOnce({
        content: JSON.stringify(buildRetainOnlyDraft()),
        model: 'test-model',
        provider: 'openai',
      })
      .mockResolvedValueOnce({
        content: JSON.stringify(buildSplitDraft(RECIPIENT)),
        model: 'test-model',
        provider: 'openai',
      });

    const draft = await FinancialAgentDraftingService.draftFromPrompt({
      name: 'Treasury Account',
      prompt: `Whenever funds hit my wallet split 40% to ${RECIPIENT} and keep the rest in my wallet`,
    });

    expect(AiService.generateCompletion).toHaveBeenCalledTimes(2);
    expect(draft.agent.networkConfigs[0]?.recipientPolicy).toBe('allowlist');
    expect(draft.agent.networkConfigs[0]?.allowedRecipients).toEqual([RECIPIENT]);

    const allocations = (draft.policies[0]?.actions[0] as any).config.allocations;
    expect(allocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'transfer', to: RECIPIENT, percentage: 40 }),
        expect.objectContaining({ kind: 'retain', percentage: 60 }),
      ])
    );
  });

  it('builds a strict prompt-driven fallback when repeated AI drafts are incomplete but the prompt is still safely inferable', async () => {
    vi.mocked(AiService.generateCompletion)
      .mockResolvedValueOnce({
        content: JSON.stringify(buildIncompleteSplitDraft(RECIPIENT)),
        model: 'test-model',
        provider: 'openai',
      })
      .mockResolvedValueOnce({
        content: JSON.stringify(buildIncompleteSplitDraft(RECIPIENT)),
        model: 'test-model',
        provider: 'openai',
      });

    const draft = await FinancialAgentDraftingService.draftFromPrompt({
      name: 'Treasury Account',
      prompt: `send 50% of any funds hitting my wallet to this address ${RECIPIENT}`,
    });

    expect(draft.agent.networkConfigs[0]?.recipientPolicy).toBe('allowlist');
    expect(draft.agent.networkConfigs[0]?.allowedRecipients).toEqual([RECIPIENT]);
    expect(draft.assumptions).toContain(
      'Created from deterministic prompt parsing because AI drafting returned an incomplete or invalid draft.'
    );
    expect(draft.assumptions).toContain(
      'The remaining unassigned funds are retained in the managed wallet for safety.'
    );

    const allocations = (draft.policies[0]?.actions[0] as any).config.allocations;
    expect(allocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'transfer', to: RECIPIENT, percentage: 50 }),
        expect.objectContaining({ kind: 'retain', percentage: 50 }),
      ])
    );
  });
});
