import { z } from 'zod';
import { validateCkbAddress } from '../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_wallet_tool';
import {
  SupportedNetwork,
  SUPPORTED_NETWORKS
} from '../../../infrastructure/database/models/FinancialAgent';
export { SupportedNetwork, SUPPORTED_NETWORKS };

import {
  FINANCIAL_EVENT_TYPES,
  FINANCIAL_POLICY_ACTION_TYPES,
  FinancialPolicyActionType,
  POLICY_CONDITION_OPS,
} from '../../../core/financial-runtime/types';


export const FINANCIAL_AGENT_PRESETS = [
  'conservative_treasury',
  'balanced_allocator',
  'aggressive_allocator',
] as const;



export const RECIPIENT_POLICIES = [
  'allowlist',
  'all',
] as const;

export type FinancialAgentPreset = typeof FINANCIAL_AGENT_PRESETS[number];
export type FinancialDraftActionType = typeof FINANCIAL_POLICY_ACTION_TYPES[number];

export const FINANCIAL_DRAFT_EVENT_TYPES = FINANCIAL_EVENT_TYPES;
export const FINANCIAL_DRAFT_ACTION_TYPES = FINANCIAL_POLICY_ACTION_TYPES;

export const DEFAULT_NETWORK: SupportedNetwork = SUPPORTED_NETWORKS[0];
const DEFAULT_ALLOWED_ACTIONS: FinancialPolicyActionType[] = [...FINANCIAL_POLICY_ACTION_TYPES];

const numericStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, 'Must be a numeric string');

const policyConditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(POLICY_CONDITION_OPS),
  value: z.unknown(),
});

const allocateTransferSchema = z.object({
  kind: z.literal('transfer'),
  percentage: z.number().min(0).max(100),
  to: z.string().min(1),
  asset: z.string().min(1).optional(),
  chain: z.enum(SUPPORTED_NETWORKS).optional(),
  label: z.string().min(1).optional(),
});

const allocateSwapSchema = z.object({
  kind: z.literal('swap'),
  percentage: z.number().min(0).max(100),
  toAsset: z.string().min(1),
  fromAsset: z.string().min(1).optional(),
  chain: z.enum(SUPPORTED_NETWORKS).optional(),
  strategy: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
});

const allocateRetainSchema = z.object({
  kind: z.literal('retain'),
  percentage: z.number().min(0).max(100),
  label: z.string().min(1).optional(),
});

const allocateFundsActionSchema = z.object({
  type: z.literal('ALLOCATE_FUNDS'),
  config: z.object({
    allocations: z.array(
      z.union([allocateTransferSchema, allocateSwapSchema, allocateRetainSchema])
    ).min(1),
  }).superRefine((config, ctx) => {
    const total = config.allocations.reduce((acc, allocation) => acc + allocation.percentage, 0);
    if (Math.abs(total - 100) > 1e-9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Funds allocation must explicitly account for 100% of funds. You allocated ${config.allocations.map(a => a.percentage).join(', ')} but left ${100 - total}% unspecified. If the remainder should stay in the agent wallet, use a retain allocation.`,
      });
    }
  }),
});

const transferFundsActionSchema = z.object({
  type: z.literal('TRANSFER_FUNDS'),
  config: z.object({
    to: z.string().min(1),
    amount: numericStringSchema,
    asset: z.string().min(1),
    chain: z.enum(SUPPORTED_NETWORKS).optional(),
    label: z.string().min(1).optional(),
  }),
});

const swapFundsActionSchema = z.object({
  type: z.literal('SWAP_FUNDS'),
  config: z.object({
    amount: numericStringSchema,
    fromAsset: z.string().min(1),
    toAsset: z.string().min(1),
    chain: z.enum(SUPPORTED_NETWORKS).optional(),
    strategy: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
  }),
});

const investFundsActionSchema = z.object({
  type: z.literal('INVEST_FUNDS'),
  config: z.object({
    strategy: z.string().min(1),
    amount: numericStringSchema,
    asset: z.string().min(1),
    chain: z.enum(SUPPORTED_NETWORKS).optional(),
    label: z.string().min(1).optional(),
  }),
});

const draftPolicyActionSchema = z.union([
  allocateFundsActionSchema,
  transferFundsActionSchema,
  swapFundsActionSchema,
  investFundsActionSchema,
]);

const assetLimitSchema = z.object({
  asset: z.string().min(1),

  maxSpendPerTx: numericStringSchema.optional(),
  maxSpendPerDay: numericStringSchema.optional(),
  maxSpendPerWeek: numericStringSchema.optional(),
  maxSpendPerMonth: numericStringSchema.optional(),

  requireApprovalAbove: numericStringSchema.optional(),
  requireApprovalForNewRecipients: z.boolean().optional(),
  requireApprovalForInvestments: z.boolean().optional(),
  requireApprovalForSwaps: z.boolean().optional(),
});

const networkConfigDraftSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).optional().default(DEFAULT_NETWORK),
  enabled: z.boolean().optional().default(true),

  allowedAssets: z.array(z.string().min(1)).optional(),
  blockedAssets: z.array(z.string().min(1)).optional(),

  allowedActions: z.array(z.enum(FINANCIAL_POLICY_ACTION_TYPES)).optional(),
  blockedActions: z.array(z.enum(FINANCIAL_POLICY_ACTION_TYPES)).optional(),

  recipientPolicy: z.enum(RECIPIENT_POLICIES).optional().default('all'),
  allowedRecipients: z.array(z.string().min(1)).optional(),
  blockedRecipients: z.array(z.string().min(1)).optional(),

  assetLimits: z.array(assetLimitSchema).optional(),
});

export const draftPolicySchema = z.object({
  trigger: z.enum(FINANCIAL_EVENT_TYPES),
  conditions: z.array(policyConditionSchema),
  actions: z.array(draftPolicyActionSchema).min(1),
  priority: z.number().int().min(1).optional(),
});

export const draftFinancialAgentInputSchema = z.object({
  agent: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    subscribedEvents: z.array(z.enum(FINANCIAL_EVENT_TYPES)).min(1),

    permissionConfig: z.object({
      allowedChains: z.array(z.enum(SUPPORTED_NETWORKS)).optional(),
      blockedChains: z.array(z.enum(SUPPORTED_NETWORKS)).optional(),
      allowedActions: z.array(z.enum(FINANCIAL_POLICY_ACTION_TYPES)).optional(),
      blockedActions: z.array(z.enum(FINANCIAL_POLICY_ACTION_TYPES)).optional(),
    }),

    approvalConfig: z.object({
      fallbackRequireApprovalForNewRecipients: z.boolean().optional(),
      fallbackRequireApprovalForInvestments: z.boolean().optional(),
      fallbackRequireApprovalForSwaps: z.boolean().optional(),
    }),

    networkConfigs: z.array(networkConfigDraftSchema).min(1),
  }),
  policies: z.array(draftPolicySchema).min(1),
  assumptions: z.array(z.string().min(1)).optional(),
});

export type DraftFinancialAgentInput = z.infer<typeof draftFinancialAgentInputSchema>;
export type DraftPolicyInput = z.infer<typeof draftPolicySchema>;

function toSet(values?: string[]): Set<string> {
  return new Set(values || []);
}

function normalizeActionPermissions(config: {
  allowedActions?: FinancialDraftActionType[];
  blockedActions?: FinancialDraftActionType[];
}) {
  const hasAllowed = Array.isArray(config.allowedActions) && config.allowedActions.length > 0;
  const hasBlocked = Array.isArray(config.blockedActions) && config.blockedActions.length > 0;

  if (!hasAllowed && !hasBlocked) {
    config.allowedActions = [...DEFAULT_ALLOWED_ACTIONS];
  }

  if (Array.isArray(config.allowedActions) && config.allowedActions.length === 0) {
    config.allowedActions = hasBlocked ? undefined : [...DEFAULT_ALLOWED_ACTIONS];
  }

  if (Array.isArray(config.blockedActions) && config.blockedActions.length === 0) {
    config.blockedActions = undefined;
  }
}

function normalizeDraft(parsed: DraftFinancialAgentInput): DraftFinancialAgentInput {
  normalizeActionPermissions(parsed.agent.permissionConfig);

  for (const cfg of parsed.agent.networkConfigs) {
    cfg.network = cfg.network || DEFAULT_NETWORK;
    cfg.recipientPolicy = cfg.recipientPolicy || 'all';

    normalizeActionPermissions(cfg);
  }

  for (const policy of parsed.policies) {
    for (const action of policy.actions) {
      if (
        action.type === 'TRANSFER_FUNDS' ||
        action.type === 'SWAP_FUNDS' ||
        action.type === 'INVEST_FUNDS'
      ) {
        action.config.chain = action.config.chain || DEFAULT_NETWORK;
      }

      if (action.type === 'ALLOCATE_FUNDS') {
        for (const allocation of action.config.allocations) {
          if (allocation.kind !== 'retain') {
            allocation.chain = allocation.chain || DEFAULT_NETWORK;
          }
        }
      }
    }
  }

  return parsed;
}

function validateDraftCrossFields(parsed: DraftFinancialAgentInput) {
  const subscribedEvents = toSet(parsed.agent.subscribedEvents);
  const globalAllowedActions = toSet(parsed.agent.permissionConfig.allowedActions);
  const globalBlockedActions = toSet(parsed.agent.permissionConfig.blockedActions);
  const globalAllowedChains = toSet(parsed.agent.permissionConfig.allowedChains);
  const globalBlockedChains = toSet(parsed.agent.permissionConfig.blockedChains);

  const networkMap = new Map(parsed.agent.networkConfigs.map((cfg) => [cfg.network, cfg] as const));

  for (const blockedAction of globalBlockedActions) {
    if (globalAllowedActions.has(blockedAction)) {
      throw {
        code: 400,
        message: `Action ${blockedAction} cannot be both globally allowed and blocked`,
      };
    }
  }

  for (const blockedChain of globalBlockedChains) {
    if (globalAllowedChains.has(blockedChain)) {
      throw {
        code: 400,
        message: `Chain ${blockedChain} cannot be both globally allowed and blocked`,
      };
    }
  }

  for (const cfg of parsed.agent.networkConfigs) {
    const localAllowedActions = toSet(cfg.allowedActions);
    const localBlockedActions = toSet(cfg.blockedActions);
    const localAllowedAssets = toSet(cfg.allowedAssets);
    const localBlockedAssets = toSet(cfg.blockedAssets);

    for (const action of localBlockedActions) {
      if (localAllowedActions.has(action)) {
        throw {
          code: 400,
          message: `Network ${cfg.network} action ${action} cannot be both allowed and blocked`,
        };
      }
    }

    for (const asset of localBlockedAssets) {
      if (localAllowedAssets.has(asset)) {
        throw {
          code: 400,
          message: `Network ${cfg.network} asset ${asset} cannot be both allowed and blocked`,
        };
      }
    }

    if (cfg.recipientPolicy === 'allowlist' && (!cfg.allowedRecipients || cfg.allowedRecipients.length === 0)) {
      throw {
        code: 400,
        message: `Network ${cfg.network} uses recipientPolicy=allowlist but has no allowedRecipients`,
      };
    }

    if (cfg.assetLimits) {
      const seenAssets = new Set<string>();

      for (const limit of cfg.assetLimits) {
        if (seenAssets.has(limit.asset)) {
          throw {
            code: 400,
            message: `Network ${cfg.network} has duplicate assetLimits entry for ${limit.asset}`,
          };
        }
        seenAssets.add(limit.asset);

        if (localBlockedAssets.has(limit.asset)) {
          throw {
            code: 400,
            message: `Network ${cfg.network} asset limit defined for blocked asset ${limit.asset}`,
          };
        }

        if (localAllowedAssets.size > 0 && !localAllowedAssets.has(limit.asset)) {
          throw {
            code: 400,
            message: `Network ${cfg.network} asset limit defined for non-allowlisted asset ${limit.asset}`,
          };
        }
      }
    }
  }

  for (const policy of parsed.policies) {
    if (!subscribedEvents.has(policy.trigger)) {
      throw {
        code: 400,
        message: `Policy trigger ${policy.trigger} must be listed in agent.subscribedEvents`,
      };
    }

    for (const action of policy.actions) {
      if (globalAllowedActions.size > 0 && !globalAllowedActions.has(action.type)) {
        throw {
          code: 400,
          message: `Policy action ${action.type} is not globally allowlisted`,
        };
      }

      if (globalBlockedActions.has(action.type)) {
        throw {
          code: 400,
          message: `Policy action ${action.type} is globally blocked`,
        };
      }

      const assertNetworkAllowed = (network: SupportedNetwork, actionType: string) => {
        if (globalBlockedChains.has(network)) {
          throw {
            code: 400,
            message: `Chain ${network} is globally blocked`,
          };
        }

        if (globalAllowedChains.size > 0 && !globalAllowedChains.has(network)) {
          throw {
            code: 400,
            message: `Chain ${network} is not globally allowlisted`,
          };
        }

        const networkCfg = networkMap.get(network);
        if (!networkCfg) {
          throw {
            code: 400,
            message: `Network ${network} is used by policy action ${actionType} but missing from agent.networkConfigs`,
          };
        }

        if (!networkCfg.enabled) {
          throw {
            code: 400,
            message: `Network ${network} is disabled but referenced by policy action ${actionType}`,
          };
        }

        const localAllowedActions = toSet(networkCfg.allowedActions);
        const localBlockedActions = toSet(networkCfg.blockedActions);

        if (localBlockedActions.has(actionType)) {
          throw {
            code: 400,
            message: `Action ${actionType} is blocked on network ${network}`,
          };
        }

        if (localAllowedActions.size > 0 && !localAllowedActions.has(actionType)) {
          throw {
            code: 400,
            message: `Action ${actionType} is not allowlisted on network ${network}. By default, allowedActions should include the full supported action set unless the user explicitly restricts actions.`,
          };
        }

        return networkCfg;
      };

      const assertAssetAllowed = (
        networkCfg: DraftFinancialAgentInput['agent']['networkConfigs'][number],
        asset: string
      ) => {
        const localAllowedAssets = toSet(networkCfg.allowedAssets);
        const localBlockedAssets = toSet(networkCfg.blockedAssets);

        if (localBlockedAssets.has(asset)) {
          throw {
            code: 400,
            message: `Asset ${asset} is blocked on network ${networkCfg.network}`,
          };
        }

        if (localAllowedAssets.size > 0 && !localAllowedAssets.has(asset)) {
          throw {
            code: 400,
            message: `Asset ${asset} is not allowlisted on network ${networkCfg.network}`,
          };
        }
      };

      if (
        action.type === 'TRANSFER_FUNDS' ||
        action.type === 'SWAP_FUNDS' ||
        action.type === 'INVEST_FUNDS'
      ) {
        const networkCfg = assertNetworkAllowed(action.config.chain!, action.type);

        if (action.type === 'TRANSFER_FUNDS') {
          assertAssetAllowed(networkCfg, action.config.asset);
        }

        if (action.type === 'SWAP_FUNDS') {
          assertAssetAllowed(networkCfg, action.config.fromAsset);
          assertAssetAllowed(networkCfg, action.config.toAsset);
        }

        if (action.type === 'INVEST_FUNDS') {
          assertAssetAllowed(networkCfg, action.config.asset);
        }
      }

      if (action.type === 'ALLOCATE_FUNDS') {
        for (const allocation of action.config.allocations) {
          if (allocation.kind === 'retain') {
            continue;
          }

          const derivedActionType = allocation.kind === 'swap' ? 'SWAP_FUNDS' : 'TRANSFER_FUNDS';
          const networkCfg = assertNetworkAllowed(allocation.chain!, derivedActionType);

          if (allocation.kind === 'transfer') {
            if (allocation.asset) {
              assertAssetAllowed(networkCfg, allocation.asset);
            }

            if (
              networkCfg.recipientPolicy === 'allowlist' &&
              (!networkCfg.allowedRecipients || !networkCfg.allowedRecipients.includes(allocation.to))
            ) {
              throw {
                code: 400,
                message: `Transfer allocation recipient ${allocation.to} is not allowlisted on network ${networkCfg.network}`,
              };
            }

            if (networkCfg.blockedRecipients?.includes(allocation.to)) {
              throw {
                code: 400,
                message: `Transfer allocation recipient ${allocation.to} is blocked on network ${networkCfg.network}`,
              };
            }
          }

          if (allocation.kind === 'swap') {
            assertAssetAllowed(networkCfg, allocation.toAsset);
            if (allocation.fromAsset) {
              assertAssetAllowed(networkCfg, allocation.fromAsset);
            }
          }
        }
      }
    }
  }
}

async function validateCkbAddressesInDraft(parsed: DraftFinancialAgentInput): Promise<void> {
  const validateOne = async (address: string) => {
    await validateCkbAddress(address);
  };

  for (const cfg of parsed.agent.networkConfigs) {
    if (cfg.network !== 'CKB') continue;

    if (cfg.allowedRecipients?.length) {
      await Promise.all(cfg.allowedRecipients.map(validateOne));
    }

    if (cfg.blockedRecipients?.length) {
      await Promise.all(cfg.blockedRecipients.map(validateOne));
    }
  }

  for (const policy of parsed.policies) {
    for (const action of policy.actions) {
      if (action.type === 'TRANSFER_FUNDS' && action.config.chain === 'CKB') {
        await validateOne(action.config.to);
      }

      if (action.type === 'ALLOCATE_FUNDS') {
        for (const allocation of action.config.allocations) {
          if (allocation.kind === 'transfer' && allocation.chain === 'CKB') {
            await validateOne(allocation.to);
          }
        }
      }
    }
  }
}

export const FinancialAgentValidationService = {
  async validateDraft(draft: DraftFinancialAgentInput): Promise<DraftFinancialAgentInput> {
    const parsed = normalizeDraft(draftFinancialAgentInputSchema.parse(draft));
    validateDraftCrossFields(parsed);
    await validateCkbAddressesInDraft(parsed);
    return parsed;
  },
};