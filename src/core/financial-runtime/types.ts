export const FINANCIAL_EVENT_TYPES = [
  'PAYMENT_LINK.PAID',
  'FUNDS.RECEIVED',
  'TIME.MONTH_STARTED',
  'APPROVAL.GRANTED',
  'APPROVAL.REJECTED',
] as const;

export type FinancialEventType = typeof FINANCIAL_EVENT_TYPES[number];

export const FINANCIAL_POLICY_ACTION_TYPES = [
  'ALLOCATE_FUNDS',
  'TRANSFER_FUNDS',
  'SWAP_FUNDS',
  'INVEST_FUNDS',
] as const;

export type FinancialPolicyActionType = typeof FINANCIAL_POLICY_ACTION_TYPES[number];

export type FinancialAgentStatus = 'active' | 'paused';

export interface FundsReceivedPayload {
  amount: string;
  asset: string;
  chain: string;
  recipientAddress: string;
  payerAddress?: string;
  txHash?: string;
}

export interface PaymentLinkPaidPayload {
  paymentLinkId: string;
  amount: string;
  asset: string;
  chain: string;
  recipientAddress: string;
  payerAddress?: string;
  txHash: string;
}

export interface TimeMonthStartedPayload {
  month: string;
  timestamp: number;
}

export interface ApprovalGrantedPayload {
  approvalRequestId: string;
  agentId: string;
  action: unknown;
  resolvedAt: number;
}

export interface ApprovalRejectedPayload {
  approvalRequestId: string;
  agentId: string;
  action: unknown;
  resolvedAt: number;
}

export interface RuntimeEventMap {
  'PAYMENT_LINK.PAID': PaymentLinkPaidPayload;
  'FUNDS.RECEIVED': FundsReceivedPayload;
  'TIME.MONTH_STARTED': TimeMonthStartedPayload;
  'APPROVAL.GRANTED': ApprovalGrantedPayload;
  'APPROVAL.REJECTED': ApprovalRejectedPayload;
}

export interface RuntimeEvent<T extends FinancialEventType = FinancialEventType> {
  id: string;
  type: T;
  workspaceId: string;
  agentId?: string;
  source: string;
  payload: RuntimeEventMap[T];
  createdAt: number;
}

export const POLICY_CONDITION_OPS = ['eq', 'gt', 'gte', 'lt', 'lte', 'in'] as const;
export type policyConditionOp = typeof POLICY_CONDITION_OPS[number];

export interface PolicyCondition {
  field: string;
  op: policyConditionOp;
  value: unknown;
}

export type PolicyAction =
  | {
    type: 'ALLOCATE_FUNDS';
    config: {
      allocations: Array<
        | {
          kind: 'transfer';
          percentage: number;
          to: string;
          asset?: string;
          chain?: string;
          label?: string;
        }
        | {
          kind: 'swap';
          percentage: number;
          toAsset: string;
          fromAsset?: string;
          chain?: string;
          strategy?: string;
          label?: string;
        }
        | {
          kind: 'retain';
          percentage: number;
          label?: string;
        }
      >;
    };
  }
  | {
    type: 'TRANSFER_FUNDS';
    config: {
      to: string;
      amount: string;
      asset: string;
      chain: string;
      label?: string;
    };
  }
  | {
    type: 'SWAP_FUNDS';
    config: {
      amount: string;
      fromAsset: string;
      toAsset: string;
      chain: string;
      strategy?: string;
      label?: string;
    };
  }
  | {
    type: 'INVEST_FUNDS';
    config: {
      strategy: string;
      amount: string;
      asset: string;
      chain: string;
      label?: string;
    };
  };

export type ExecutableAction =
  | {
    type: 'TRANSFER_FUNDS';
    config: {
      to: string;
      amount: string;
      asset: string;
      chain: string;
      label?: string;
    };
  }
  | {
    type: 'SWAP_FUNDS';
    config: {
      amount: string;
      fromAsset: string;
      toAsset: string;
      chain: string;
      strategy?: string;
      label?: string;
    };
  }
  | {
    type: 'INVEST_FUNDS';
    config: {
      strategy: string;
      amount: string;
      asset: string;
      chain: string;
      label?: string;
    };
  }
  | {
    type: 'RETAIN_FUNDS';
    config: {
      amount: string;
      label?: string;
    };
  };

export interface MatchedPolicy {
  policyId: string;
  priority: number;
  actions: PolicyAction[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface ApprovalDecision {
  required: boolean;
  requestId?: string;
  reason?: string;
}