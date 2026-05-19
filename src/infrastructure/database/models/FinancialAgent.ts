import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  FINANCIAL_EVENT_TYPES,
  FINANCIAL_POLICY_ACTION_TYPES,
  FinancialAgentStatus,
  FinancialEventType,
} from '../../../core/financial-runtime/types';

export const SUPPORTED_NETWORKS = ['CKB'] as const;
export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number];

export const RECIPIENT_POLICIES = ['allowlist', 'all'] as const;
export type RecipientPolicy = typeof RECIPIENT_POLICIES[number];

export interface AgentWalletConfig {
  address: string;
  privateKey: string; // TODO: Implement vTEE`s private key storage
  walletType: 'managed';
}

export interface AssetLimitConfig {
  asset: string;

  maxSpendPerTx?: string;
  maxSpendPerDay?: string;
  maxSpendPerWeek?: string;
  maxSpendPerMonth?: string;

  requireApprovalAbove?: string;
  requireApprovalForNewRecipients?: boolean;
  requireApprovalForInvestments?: boolean;
  requireApprovalForSwaps?: boolean;
}

export interface AgentNetworkConfig {
  network: SupportedNetwork;
  enabled: boolean;

  wallet: AgentWalletConfig;

  allowedAssets?: string[];
  blockedAssets?: string[];

  allowedActions?: Array<(typeof FINANCIAL_POLICY_ACTION_TYPES)[number]>;
  blockedActions?: Array<(typeof FINANCIAL_POLICY_ACTION_TYPES)[number]>;

  recipientPolicy: RecipientPolicy;
  allowedRecipients?: string[];
  blockedRecipients?: string[];

  assetLimits?: AssetLimitConfig[];

  metadata?: Record<string, unknown>;
}

export interface IFinancialAgent extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  status: FinancialAgentStatus;
  subscribedEvents: FinancialEventType[];
  stateId?: Types.ObjectId;

  networkConfigs: AgentNetworkConfig[];

  permissionConfig: {
    allowedChains?: SupportedNetwork[];
    blockedChains?: SupportedNetwork[];
    allowedActions?: Array<(typeof FINANCIAL_POLICY_ACTION_TYPES)[number]>;
    blockedActions?: Array<(typeof FINANCIAL_POLICY_ACTION_TYPES)[number]>;
  };

  approvalConfig: {
    fallbackRequireApprovalForNewRecipients?: boolean;
    fallbackRequireApprovalForInvestments?: boolean;
    fallbackRequireApprovalForSwaps?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const AgentWalletSchema = new Schema(
  {
    address: { type: String, required: true },
    privateKey: { type: String, required: true },
    walletType: {
      type: String,
      enum: ['managed'],
      default: 'managed',
      required: true,
    },
  },
  { _id: false }
);

const AssetLimitSchema = new Schema(
  {
    asset: { type: String, required: true },

    maxSpendPerTx: { type: String },
    maxSpendPerDay: { type: String },
    maxSpendPerWeek: { type: String },
    maxSpendPerMonth: { type: String },

    requireApprovalAbove: { type: String },
    requireApprovalForNewRecipients: { type: Boolean },
    requireApprovalForInvestments: { type: Boolean },
    requireApprovalForSwaps: { type: Boolean },
  },
  { _id: false }
);

const AgentNetworkConfigSchema = new Schema(
  {
    network: {
      type: String,
      enum: SUPPORTED_NETWORKS,
      required: true,
      default: 'CKB',
    },
    enabled: { type: Boolean, default: true },

    wallet: {
      type: AgentWalletSchema,
      required: true,
    },

    allowedAssets: [{ type: String }],
    blockedAssets: [{ type: String }],

    allowedActions: [{ type: String, enum: FINANCIAL_POLICY_ACTION_TYPES }],
    blockedActions: [{ type: String, enum: FINANCIAL_POLICY_ACTION_TYPES }],

    recipientPolicy: {
      type: String,
      enum: RECIPIENT_POLICIES,
      default: 'all',
      required: true,
    },
    allowedRecipients: [{ type: String }],
    blockedRecipients: [{ type: String }],

    assetLimits: {
      type: [AssetLimitSchema],
      default: [],
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const FinancialAgentSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    description: { type: String },

    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true,
    },

    subscribedEvents: {
      type: [String],
      enum: FINANCIAL_EVENT_TYPES,
      default: [],
    },

    stateId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAgentState',
    },

    networkConfigs: {
      type: [AgentNetworkConfigSchema],
      default: [],
    },

    permissionConfig: {
      allowedChains: [{ type: String, enum: SUPPORTED_NETWORKS }],
      blockedChains: [{ type: String, enum: SUPPORTED_NETWORKS }],
      allowedActions: [{ type: String, enum: FINANCIAL_POLICY_ACTION_TYPES }],
      blockedActions: [{ type: String, enum: FINANCIAL_POLICY_ACTION_TYPES }],
    },

    approvalConfig: {
      fallbackRequireApprovalForNewRecipients: { type: Boolean },
      fallbackRequireApprovalForInvestments: { type: Boolean },
      fallbackRequireApprovalForSwaps: { type: Boolean },
    },
  },
  { timestamps: true }
);

FinancialAgentSchema.index({ workspaceId: 1, status: 1 });
FinancialAgentSchema.index({ workspaceId: 1, name: 1 });

export const FinancialAgent = mongoose.model<IFinancialAgent>(
  'FinancialAgent',
  FinancialAgentSchema
);