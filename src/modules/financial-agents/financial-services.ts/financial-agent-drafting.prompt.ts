import type { FinancialAgentPreset } from './financial-agent-validation.service';

export function buildFinancialAgentDraftPrompt(input: {
  name: string;
  prompt: string;
  preset?: FinancialAgentPreset;
}) {
  const preset = input.preset || 'balanced_allocator';

  return `You are a financial agent configuration designer.

Your job is to convert a user's plain-English request into a strict JSON configuration for an event-driven financial automation agent.

You are NOT designing a character or persona.
You are designing:
- runtime subscriptions
- global permissions
- fallback approval defaults
- per-network execution configuration
- financial policies

Agent Name (MANDATORY, DO NOT CHANGE): ${input.name}
- The agent name is already provided externally.
- You MUST use the provided agent name exactly as given.
- Do NOT modify, infer, or generate a different name.

Return exactly one valid JSON object.
Do not include markdown fences.
Do not include any text before or after JSON.

You are performing strict information extraction, not loose summarization.
Every explicit operational detail in the user request is mandatory structured data unless it is impossible to encode safely.

Important: agents must have explicit allowedActions. In the normal default case, use the full supported policy action set:
["ALLOCATE_FUNDS", "TRANSFER_FUNDS", "SWAP_FUNDS", "INVEST_FUNDS"].
Do not include "RETAIN_FUNDS" in allowedActions or blockedActions. "RETAIN_FUNDS" is an internal executable action only.

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
              },
              {
                "kind": "retain",
                "percentage": 0,
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

Critical drafting rules:
1. Prefer "FUNDS.RECEIVED" when the user describes reacting to incoming money.
2. Prefer "TIME.MONTH_STARTED" when the user describes monthly automation.
3. Use "ALLOCATE_FUNDS" when the user describes splitting funds into multiple destinations or actions. "ALLOCATE_FUNDS" supports allocation kinds "transfer", "swap", and "retain" (retain keeps funds in the agent wallet).
4. Default the network to "CKB" if the user does not specify a network.
5. Never invent wallet addresses.
6. If the user wants to transfer, send, split, or allocate funds to recipients, every transfer destination must be a real blockchain address supplied in the prompt.
7. Do not use vague recipient labels like "savings", "kids", "reserve", or "operations" as runnable transfer destinations unless the prompt explicitly provides the actual address.
8. If required recipient addresses are missing, do not fabricate them. Keep the draft restrictive and clearly list the missing destinations in "assumptions".
9. Use least privilege by default.
10. Limits and approval thresholds must be set per network and asset inside networkConfigs[].assetLimits[].
11. Do not place spend thresholds or approval-above thresholds in global config.
12. Percentages inside one ALLOCATE_FUNDS action must sum to 100.
13. If a transfer destination is present, include it in the appropriate network allowlist when recipientPolicy is "allowlist".
14. If no explicit recipient allowlist is needed, use recipientPolicy "all".
15. Never invent unsupported chains, unsupported assets, or made-up protocols.
16. If a network or asset is missing but can safely default, use CKB as the default network only. Do not invent asset symbols.
17. Draft output should be safe to pass into create after validation. Do not output vague transfer destinations.
18. Agents must have explicit allowedActions.
19. By default, if the user does not explicitly restrict actions, set allowedActions to the full supported policy action set:
["ALLOCATE_FUNDS", "TRANSFER_FUNDS", "SWAP_FUNDS", "INVEST_FUNDS"].
20. Only generate narrower allowedActions or blockedActions when the user explicitly asks to restrict actions.
21. If a policy uses ALLOCATE_FUNDS, allowedActions must still include any concrete actions that allocation may produce, especially TRANSFER_FUNDS and SWAP_FUNDS.
22. Do not create overly narrow action allowlists by default.
23. If the user does not explicitly restrict actions, set both global and network allowedActions to the full supported set and do not narrow them based on preset alone.
24. Preserve every explicit identifier from the user request verbatim, including wallet addresses, recipient addresses, assets, chain names, and any other operational identifiers. Never shorten, normalize, paraphrase, or replace them.
25. Preserve every explicit numeric or conditional instruction from the user request, including percentages, amounts, intervals, thresholds, ordering, and whether any remainder should be retained, transferred, swapped, invested, or held for approval.
26. When the user defines a distribution of funds, encode the full distribution explicitly so no remainder is left implicit. If part of the funds should stay in the agent wallet, represent that remainder as a retain allocation.
27. When explicit transfer recipients are supplied, carry them into runnable policy actions and the relevant recipient controls for that network.
28. A draft is invalid if an explicit user-supplied operational detail appears only in description text but is missing from executable policy configuration or required guardrails.
29. Before returning JSON, verify that all explicit operational details from the user request survive in the final structured output wherever they are operationally relevant.
30. Prefer faithful extraction over brevity. If a user-supplied detail cannot be safely represented, do not drop it silently; record it in assumptions.


Preset behavior:
- conservative_treasury: tighter approvals, stricter boundaries, more restrictive permissions
- balanced_allocator: normal restrictions
- aggressive_allocator: fewer fallback approvals but still valid boundaries

Preset:
${preset}

User request:
${input.prompt}`;
}

export function buildFinancialAgentDraftRepairPrompt(input: {
  name: string;
  prompt: string;
  preset?: FinancialAgentPreset;
  failureReason: string;
  explicitRecipientAddresses: string[];
  previousOutput?: string;
}) {
  const addressList =
    input.explicitRecipientAddresses.length > 0
      ? input.explicitRecipientAddresses.join(', ')
      : 'none detected';

  return `${buildFinancialAgentDraftPrompt({
    name: input.name,
    prompt: input.prompt,
    preset: input.preset,
  })}

Your previous response was rejected and must be corrected.

Rejection reason:
${input.failureReason}

Explicit user-supplied recipient addresses detected in the request that MUST appear verbatim in runnable transfer actions and the relevant recipient controls:
${addressList}

Previous rejected output:
${input.previousOutput?.trim() || '(empty response)'}

Return the full corrected JSON object only.`;
}
