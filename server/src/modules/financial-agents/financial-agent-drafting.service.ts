import { AiService } from '../ai/ai.service';
import {
  DraftFinancialAgentInput,
  FinancialAgentPreset,
  FINANCIAL_AGENT_PRESETS,
  KnownRecipientInput,
  draftFinancialAgentInputSchema,
} from './financial-agent-validation.service';

function buildPrompt(input: {
  prompt: string;
  preset?: FinancialAgentPreset;
  knownRecipients?: KnownRecipientInput[];
}) {
  const preset =
    input.preset && FINANCIAL_AGENT_PRESETS.includes(input.preset)
      ? input.preset
      : 'balanced_allocator';

  return `You are a financial agent configuration designer.

Your job is to convert a user's plain-English request into a strict JSON configuration for an event-driven financial automation agent.

You are NOT designing a character or persona.
You are designing:
- runtime subscriptions
- global permissions
- fallback approval defaults
- per-network execution configuration
- financial policies

Return exactly one valid JSON object.
Do not include markdown fences.
Do not include any text before or after JSON.

The JSON must follow this exact shape:
{
  "agent": {
    "name": "string",
    "description": "string",
    "subscribedEvents": ["FUNDS.RECEIVED" | "TIME.MONTH_STARTED" | "APPROVAL.GRANTED" | "APPROVAL.REJECTED"],
    "permissionConfig": {
      "allowedChains": ["CKB"]?,
      "blockedChains": ["CKB"]?,
      "allowedActions": ["ALLOCATE_FUNDS" | "TRANSFER_FUNDS" | "SWAP_FUNDS" | "INVEST_FUNDS"]?,
      "blockedActions": ["ALLOCATE_FUNDS" | "TRANSFER_FUNDS" | "SWAP_FUNDS" | "INVEST_FUNDS"]?
    },
    "approvalConfig": {
      "fallbackRequireApprovalForNewRecipients": "boolean?",
      "fallbackRequireApprovalForInvestments": "boolean?",
      "fallbackRequireApprovalForSwaps": "boolean?"
    },
    "networkConfigs": [
      {
        "network": "CKB",
        "enabled": true,
        "allowedAssets": ["string"]?,
        "blockedAssets": ["string"]?,
        "allowedActions": ["ALLOCATE_FUNDS" | "TRANSFER_FUNDS" | "SWAP_FUNDS" | "INVEST_FUNDS"]?,
        "blockedActions": ["ALLOCATE_FUNDS" | "TRANSFER_FUNDS" | "SWAP_FUNDS" | "INVEST_FUNDS"]?,
        "recipientPolicy": "allowlist" | "all",
        "allowedRecipients": ["string"]?,
        "blockedRecipients": ["string"]?,
        "assetLimits": [
          {
            "asset": "string",
            "maxSpendPerTx": "string?",
            "maxSpendPerDay": "string?",
            "maxSpendPerWeek": "string?",
            "maxSpendPerMonth": "string?",
            "requireApprovalAbove": "string?",
            "requireApprovalForNewRecipients": "boolean?",
            "requireApprovalForInvestments": "boolean?",
            "requireApprovalForSwaps": "boolean?"
          }
        ]?
      }
    ]
  },
  "policies": [
    {
      "trigger": "FUNDS.RECEIVED" | "TIME.MONTH_STARTED" | "APPROVAL.GRANTED" | "APPROVAL.REJECTED",
      "conditions": [
        {
          "field": "string",
          "op": "eq" | "gt" | "gte" | "lt" | "lte" | "in",
          "value": "any"
        }
      ],
      "actions": [
        {
          "type": "ALLOCATE_FUNDS",
          "config": {
            "allocations": [
              {
                "kind": "transfer",
                "percentage": 0,
                "to": "string",
                "asset": "string?",
                "chain": "CKB",
                "label": "string?"
              },
              {
                "kind": "swap",
                "percentage": 0,
                "toAsset": "string",
                "fromAsset": "string?",
                "chain": "CKB",
                "strategy": "string?",
                "label": "string?"
              }
            ]
          }
        },
        {
          "type": "TRANSFER_FUNDS",
          "config": {
            "to": "string",
            "amount": "string",
            "asset": "string",
            "chain": "CKB",
            "label": "string?"
          }
        },
        {
          "type": "SWAP_FUNDS",
          "config": {
            "amount": "string",
            "fromAsset": "string",
            "toAsset": "string",
            "chain": "CKB",
            "strategy": "string?",
            "label": "string?"
          }
        },
        {
          "type": "INVEST_FUNDS",
          "config": {
            "strategy": "string",
            "amount": "string",
            "asset": "string",
            "chain": "CKB",
            "label": "string?"
          }
        }
      ],
      "priority": 1
    }
  ],
  "assumptions": ["string"]
}

Safety and quality rules:
1. Prefer "FUNDS.RECEIVED" when the user describes reacting to incoming money.
2. Prefer "TIME.MONTH_STARTED" when the user describes monthly automation.
3. Use "ALLOCATE_FUNDS" when the user describes splitting funds into multiple destinations or actions.
4. Never invent wallet addresses.
5. Never invent chains or assets unless the user clearly stated them.
6. If recipient labels match known recipients, resolve them to the provided addresses and chains.
7. If details are missing, keep the draft restrictive and record the missing pieces in assumptions.
8. Limits and approval thresholds must be set per network and asset inside networkConfigs[].assetLimits[].
9. Do not place spend thresholds or approval-above thresholds in global config.
10. Percentages inside one ALLOCATE_FUNDS action must sum to 100.
11. Use least privilege by default.
12. If a network uses recipientPolicy "allowlist", allowedRecipients must contain the transfer destinations for that network.

Preset behavior:
- conservative_treasury: tighter approvals and tighter asset/recipient permissions
- balanced_allocator: normal restrictions
- aggressive_allocator: fewer fallback approvals but still valid boundaries

Known recipients:
${JSON.stringify(input.knownRecipients || [])}

Preset:
${preset}

User request:
${input.prompt}`;
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

    const result = draftFinancialAgentInputSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    if (!validationError) {
      validationError = result.error.issues[0]?.message;
    }
  }

  throw {
    code: 400,
    message: validationError || 'Drafting model returned invalid JSON',
  };
}

export const FinancialAgentDraftingService = {
  async draftFromPrompt(input: {
    prompt: string;
    preset?: FinancialAgentPreset;
    knownRecipients?: KnownRecipientInput[];
  }): Promise<DraftFinancialAgentInput> {
    if (!input.prompt?.trim()) {
      throw { code: 400, message: 'Prompt is required' };
    }

    const completion = await AiService.generateCompletion({
      messages: [{ role: 'user', content: buildPrompt(input) }],
      temperature: 0.1,
    });

    return parseDraftFromModelOutput(completion.content || '');
  },
};