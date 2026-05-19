import { AiService } from '../../ai/ai.service';
import {
  DraftFinancialAgentInput,
  FinancialAgentPreset,
  FINANCIAL_AGENT_PRESETS,
  SupportedNetwork,
  draftFinancialAgentInputSchema,
} from './financial-agent-validation.service';
import {
  buildFinancialAgentDraftPrompt,
  buildFinancialAgentDraftRepairPrompt,
} from './financial-agent-drafting.prompt';

const CKB_ADDRESS_REGEX = /\b(?:ckb|ckt)1[0-9a-z]{20,}\b/gi;
const RECIPIENT_TRANSFER_INTENT_REGEX =
  /\b(transfer|send|split|allocate|forward|move|route|pay|distribute)\b/i;
const RETAIN_INTENT_REGEX =
  /\b(keep|retain|hold|leave|rest|remaining|remainder|stay)\b/i;
const PERCENTAGE_REGEX = /(\d+(?:\.\d+)?)\s*%/g;

const DEFAULT_ALLOWED_ACTIONS = [
  'ALLOCATE_FUNDS',
  'TRANSFER_FUNDS',
  'SWAP_FUNDS',
  'INVEST_FUNDS',
] as const;

type JsonRecord = Record<string, unknown>;

function buildFallbackDraft(input: {
  name: string;
  prompt: string;
  preset: FinancialAgentPreset;
}): DraftFinancialAgentInput {
  return {
    agent: {
      name: input.name,
      description: input.prompt,
      subscribedEvents: ['FUNDS.RECEIVED'],
      permissionConfig: {
        allowedChains: ['CKB'],
        allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
      },
      approvalConfig: {
        fallbackRequireApprovalForNewRecipients: input.preset === 'conservative_treasury',
        fallbackRequireApprovalForInvestments: input.preset !== 'aggressive_allocator',
        fallbackRequireApprovalForSwaps: input.preset !== 'aggressive_allocator',
      },
      networkConfigs: [
        {
          network: 'CKB',
          enabled: true,
          allowedAssets: ['CKB'],
          allowedActions: ['ALLOCATE_FUNDS', 'TRANSFER_FUNDS', 'SWAP_FUNDS', 'INVEST_FUNDS'],
          recipientPolicy: 'all',
          assetLimits: [
            {
              asset: 'CKB',
              requireApprovalForNewRecipients: input.preset === 'conservative_treasury',
              requireApprovalForInvestments: input.preset !== 'aggressive_allocator',
              requireApprovalForSwaps: input.preset !== 'aggressive_allocator',
            },
          ],
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
                  kind: 'retain',
                  percentage: 100,
                  label: 'Retain funds in managed wallet',
                },
              ],
            },
          },
        ],
        priority: 1,
      },
    ],
    assumptions: [
      'Created with a safe fallback draft because AI drafting was unavailable.',
      'Funds are retained in the managed wallet until a more specific policy is configured.',
    ],
  };
}

function extractBalancedJsonObjects(text: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function collectJsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    candidates.push(trimmed);
  }

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    const body = (match[1] || '').trim();
    if (body) candidates.push(body);
  }

  candidates.push(...extractBalancedJsonObjects(text));

  return [...new Set(candidates)].sort((a, b) => b.length - a.length);
}

function isPlainObject(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function coerceDraftCandidate(candidate: unknown): unknown {
  if (!isPlainObject(candidate)) return candidate;

  const root = candidate;
  const agent = isPlainObject(root.agent) ? root.agent : {};
  const rawPolicies = Array.isArray(root.policies) ? root.policies : [];
  const subscribedEvents =
    Array.isArray(agent.subscribedEvents) && agent.subscribedEvents.length > 0
      ? agent.subscribedEvents
      : ['FUNDS.RECEIVED'];

  const policies = rawPolicies.map((policy) => {
    if (!isPlainObject(policy)) return policy;

    return {
      ...policy,
      trigger:
        typeof policy.trigger === 'string' && policy.trigger.trim()
          ? policy.trigger
          : subscribedEvents[0],
      conditions: Array.isArray(policy.conditions) ? policy.conditions : [],
      actions: Array.isArray(policy.actions) ? policy.actions : [],
    };
  });

  const networkConfigs =
    Array.isArray(agent.networkConfigs) && agent.networkConfigs.length > 0
      ? agent.networkConfigs.map((cfg) =>
          isPlainObject(cfg)
            ? {
                ...cfg,
                network: typeof cfg.network === 'string' && cfg.network.trim() ? cfg.network : 'CKB',
                enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : true,
                recipientPolicy:
                  typeof cfg.recipientPolicy === 'string' && cfg.recipientPolicy.trim()
                    ? cfg.recipientPolicy
                    : 'all',
              }
            : cfg
        )
      : [
          {
            network: 'CKB',
            enabled: true,
            recipientPolicy: 'all',
            allowedActions: [...DEFAULT_ALLOWED_ACTIONS],
          },
        ];

  return {
    ...root,
    agent: {
      ...agent,
      name: typeof agent.name === 'string' && agent.name.trim() ? agent.name : 'Draft Agent',
      description:
        typeof agent.description === 'string' && agent.description.trim()
          ? agent.description
          : 'Drafted financial agent configuration.',
      subscribedEvents,
      permissionConfig: isPlainObject(agent.permissionConfig) ? agent.permissionConfig : {},
      approvalConfig: isPlainObject(agent.approvalConfig) ? agent.approvalConfig : {},
      networkConfigs,
    },
    policies,
    assumptions: Array.isArray(root.assumptions) ? root.assumptions : [],
  };
}

function formatValidationIssue(issue: { path?: Array<string | number>; message?: string }): string {
  const path = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : 'draft';
  return `${path}: ${issue.message || 'Invalid value'}`;
}

function parseDraftFromModelOutput(content: string): DraftFinancialAgentInput {
  const candidates = collectJsonCandidates(content);

  if (candidates.length === 0) {
    throw { code: 400, message: 'Drafting model did not return JSON content' };
  }

  let validationError: string | undefined;

  for (const candidate of candidates) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }

    const result = draftFinancialAgentInputSchema.safeParse(coerceDraftCandidate(parsed));
    if (result.success) {
      return result.data;
    }

    if (!validationError) {
      validationError = formatValidationIssue(result.error.issues[0] || {});
    }
  }

  throw {
    code: 400,
    message: validationError || 'Drafting model returned invalid JSON',
  };
}

function extractPromptRecipientAddresses(prompt: string): string[] {
  return [...new Set((prompt.match(CKB_ADDRESS_REGEX) || []).map((address) => address.trim()))];
}

function hasExplicitRecipientTransferIntent(prompt: string): boolean {
  return RECIPIENT_TRANSFER_INTENT_REGEX.test(prompt);
}

function hasRetainIntent(prompt: string): boolean {
  return RETAIN_INTENT_REGEX.test(prompt);
}

function extractPromptAddressMatches(prompt: string): Array<{ address: string; index: number }> {
  const matches: Array<{ address: string; index: number }> = [];
  const regex = new RegExp(CKB_ADDRESS_REGEX.source, CKB_ADDRESS_REGEX.flags);

  for (let match = regex.exec(prompt); match !== null; match = regex.exec(prompt)) {
    matches.push({
      address: match[0],
      index: match.index,
    });
  }

  return matches;
}

function extractPromptPercentages(prompt: string): Array<{ value: number; index: number }> {
  const matches: Array<{ value: number; index: number }> = [];
  const regex = new RegExp(PERCENTAGE_REGEX.source, PERCENTAGE_REGEX.flags);

  for (let match = regex.exec(prompt); match !== null; match = regex.exec(prompt)) {
    const value = Number(match[1]);
    if (!Number.isFinite(value)) continue;

    matches.push({
      value,
      index: match.index,
    });
  }

  return matches;
}

function matchPromptPercentagesToRecipients(prompt: string): Array<{ address: string; percentage: number }> | null {
  const addresses = extractPromptAddressMatches(prompt);
  const percentages = extractPromptPercentages(prompt);

  if (addresses.length === 0) return null;

  if (addresses.length === 1 && percentages.length === 1) {
    return [{ address: addresses[0].address, percentage: percentages[0].value }];
  }

  const unusedPercentages = new Set(percentages.map((_, index) => index));
  const assignments: Array<{ address: string; percentage: number | null }> = addresses.map((entry) => ({
    address: entry.address,
    percentage: null,
  }));

  for (let i = 0; i < addresses.length; i += 1) {
    const address = addresses[i];
    let bestIndex: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const percentageIndex of unusedPercentages) {
      const percentage = percentages[percentageIndex];
      const distance = Math.abs(percentage.index - address.index);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = percentageIndex;
      }
    }

    if (bestIndex !== null && bestDistance <= 160) {
      assignments[i].percentage = percentages[bestIndex].value;
      unusedPercentages.delete(bestIndex);
    }
  }

  if (assignments.some((entry) => entry.percentage === null) && addresses.length === percentages.length) {
    for (let i = 0; i < assignments.length; i += 1) {
      assignments[i].percentage = percentages[i]?.value ?? null;
    }
  }

  if (assignments.some((entry) => entry.percentage === null)) {
    return null;
  }

  return assignments.map((entry) => ({
    address: entry.address,
    percentage: entry.percentage as number,
  }));
}

function buildPromptStructuredFallback(input: {
  name: string;
  prompt: string;
  preset: FinancialAgentPreset;
}): DraftFinancialAgentInput | null {
  if (!hasExplicitRecipientTransferIntent(input.prompt)) return null;

  const recipientPlans = matchPromptPercentagesToRecipients(input.prompt);
  if (!recipientPlans || recipientPlans.length === 0) return null;

  const totalPercentage = recipientPlans.reduce((sum, entry) => sum + entry.percentage, 0);
  if (totalPercentage <= 0 || totalPercentage > 100) return null;

  const fallback = buildFallbackDraft(input);
  fallback.agent.description = input.prompt;
  fallback.agent.networkConfigs[0]!.recipientPolicy = 'allowlist';
  fallback.agent.networkConfigs[0]!.allowedRecipients = recipientPlans.map((entry) => entry.address);
  fallback.policies = [
    {
      trigger: 'FUNDS.RECEIVED',
      conditions: [],
      actions: [
        {
          type: 'ALLOCATE_FUNDS',
          config: {
            allocations: [
              ...recipientPlans.map((entry) => ({
                kind: 'transfer' as const,
                percentage: entry.percentage,
                to: entry.address,
                chain: 'CKB' as const,
              })),
              ...(totalPercentage < 100
                ? [
                    {
                      kind: 'retain' as const,
                      percentage: 100 - totalPercentage,
                      label: 'Retain remaining funds in the managed wallet',
                    },
                  ]
                : []),
            ],
          },
        },
      ],
      priority: 1,
    },
  ];

  fallback.assumptions = [
    'Created from deterministic prompt parsing because AI drafting returned an incomplete or invalid draft.',
  ];

  if (totalPercentage < 100 && !hasRetainIntent(input.prompt)) {
    fallback.assumptions.push('The remaining unassigned funds are retained in the managed wallet for safety.');
  }

  return fallback;
}

function collectPolicyRecipientsByNetwork(
  draft: DraftFinancialAgentInput
): Map<SupportedNetwork, Set<string>> {
  const recipientsByNetwork = new Map<SupportedNetwork, Set<string>>();

  const appendRecipient = (network: SupportedNetwork, address: string) => {
    const existing = recipientsByNetwork.get(network) || new Set<string>();
    existing.add(address);
    recipientsByNetwork.set(network, existing);
  };

  for (const policy of draft.policies) {
    for (const action of policy.actions) {
      if (action.type === 'TRANSFER_FUNDS') {
        appendRecipient(action.config.chain as SupportedNetwork, action.config.to);
      }

      if (action.type === 'ALLOCATE_FUNDS') {
        for (const allocation of action.config.allocations) {
          if (allocation.kind === 'transfer' && allocation.chain) {
            appendRecipient(allocation.chain as SupportedNetwork, allocation.to);
          }
        }
      }
    }
  }

  return recipientsByNetwork;
}

function enforcePromptRecipientConsistency(
  prompt: string,
  draft: DraftFinancialAgentInput
): DraftFinancialAgentInput {
  const promptRecipients = extractPromptRecipientAddresses(prompt);
  if (promptRecipients.length === 0 || !hasExplicitRecipientTransferIntent(prompt)) return draft;

  const policyRecipientsByNetwork = collectPolicyRecipientsByNetwork(draft);
  const policyRecipients = new Set(
    [...policyRecipientsByNetwork.values()].flatMap((recipients) => [...recipients])
  );

  const missingRecipients = promptRecipients.filter((address) => !policyRecipients.has(address));
  if (missingRecipients.length > 0) {
    throw {
      code: 400,
      message: `Draft omitted explicit recipient address${missingRecipients.length > 1 ? 'es' : ''}: ${missingRecipients.join(', ')}`,
    };
  }

  for (const cfg of draft.agent.networkConfigs) {
    const recipients = policyRecipientsByNetwork.get(cfg.network);
    if (!recipients || recipients.size === 0) continue;

    cfg.recipientPolicy = 'allowlist';
    cfg.allowedRecipients = [...new Set([...(cfg.allowedRecipients || []), ...recipients])];
  }

  return draft;
}

function toDraftingError(err: any, fallbackMessage: string) {
  return {
    code: err?.code || 500,
    message: err?.message || fallbackMessage,
  };
}

async function requestDraftCompletion(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return AiService.generateCompletion({
    messages,
    temperature: 0.1,
  });
}

export const FinancialAgentDraftingService = {
  async draftFromPrompt(input: {
    name: string;
    prompt: string;
    preset?: FinancialAgentPreset;
  }): Promise<DraftFinancialAgentInput> {
    if (!input.prompt?.trim()) {
      throw { code: 400, message: 'Prompt is required' };
    }

    const preset =
      input.preset && FINANCIAL_AGENT_PRESETS.includes(input.preset)
        ? input.preset
        : 'balanced_allocator';
    const explicitRecipientAddresses = extractPromptRecipientAddresses(input.prompt);
    const strictRecipientChecks = hasExplicitRecipientTransferIntent(input.prompt);
    let previousOutput = '';

    try {
      const completion = await requestDraftCompletion([
        {
          role: 'user',
          content: buildFinancialAgentDraftPrompt({
            name: input.name,
            prompt: input.prompt,
            preset,
          }),
        },
      ]);
      previousOutput = completion.content || '';

      const draft = enforcePromptRecipientConsistency(
        input.prompt,
        parseDraftFromModelOutput(previousOutput)
      );
      draft.agent.name = input.name;
      return draft;
    } catch (firstErr: any) {
      try {
        const repairedCompletion = await requestDraftCompletion([
          {
            role: 'user',
            content: buildFinancialAgentDraftPrompt({
              name: input.name,
              prompt: input.prompt,
              preset,
            }),
          },
          {
            role: 'assistant',
            content: previousOutput,
          },
          {
            role: 'user',
            content: buildFinancialAgentDraftRepairPrompt({
              name: input.name,
              prompt: input.prompt,
              preset,
              failureReason: firstErr?.message || 'The previous draft was invalid.',
              explicitRecipientAddresses,
              previousOutput,
            }),
          },
        ]);

        const repairedDraft = enforcePromptRecipientConsistency(
          input.prompt,
          parseDraftFromModelOutput(repairedCompletion.content || '')
        );
        repairedDraft.agent.name = input.name;
        return repairedDraft;
      } catch (repairErr: any) {
        const promptStructuredFallback = buildPromptStructuredFallback({
          name: input.name,
          prompt: input.prompt,
          preset,
        });

        if (promptStructuredFallback) {
          return promptStructuredFallback;
        }

        if (strictRecipientChecks && explicitRecipientAddresses.length > 0) {
          throw toDraftingError(
            repairErr,
            'AI draft could not preserve explicit recipient addresses from the prompt. Refusing to create a generic fallback draft.'
          );
        }

        console.warn(
          '[FinancialAgentDraftingService] AI draft failed, using fallback draft:',
          repairErr?.message || firstErr?.message || repairErr || firstErr
        );
      }

      return buildFallbackDraft({
        name: input.name,
        prompt: input.prompt,
        preset,
      });
    }
  },
};
