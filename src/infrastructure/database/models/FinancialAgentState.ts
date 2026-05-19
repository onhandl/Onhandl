import mongoose, { Document, Schema, Types } from 'mongoose';

export interface AssetBalance {
    asset: string;           // e.g. 'CKB', 'USDC', 'SUDT-xxx'
    rawAmount: string;       // onchain raw amount (Shannon for CKB)
    displayAmount: string;   // human-readable e.g. '1500.50'
    usdValue?: string;       // USD equivalent e.g. '18.23'
    usdPrice?: string;       // price used for conversion e.g. '0.01215'
    priceSource?: string;    // e.g. 'coingecko', 'binance'
    lastSyncedAt: Date;
    lastPriceFetchedAt?: Date;
}

export interface IFinancialAgentState extends Document {
    agentId: Types.ObjectId;
    workspaceId: Types.ObjectId;

    balances: AssetBalance[];

    // Aggregated totals (computed and cached)
    totalUsdValue?: string;       // sum of all asset USD values
    totalNativeAmount?: string;   // ie. for CKB: sum of all CKB-denominated assets in CKB

    lastFullSyncAt?: Date;        // when ALL balances were last synced together
    isSyncing?: boolean;          // lock flag to prevent parallel sync jobs
    lastEventAt?: Date;
    lastExecutionAt?: Date;
    metadata?: Record<string, unknown>;

    counters: Record<string, string>;
    pendingApprovalIds: Types.ObjectId[];

    // Spend tracking (for policy enforcement)
    dailySpent: Record<string, string>;    // ie. { CKB: '500000000' }
    weeklySpent: Record<string, string>;
    monthlySpent: Record<string, string>;
    spendWindowResetAt: {
        daily: Date;
        weekly: Date;
        monthly: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

const AssetBalanceSchema = new Schema(
    {
        asset: { type: String, required: true },
        rawAmount: { type: String, required: true },
        displayAmount: { type: String, required: true },
        usdValue: { type: String },
        usdPrice: { type: String },
        priceSource: { type: String },
        lastSyncedAt: { type: Date, required: true },
        lastPriceFetchedAt: { type: Date },
    },
    { _id: false }
);

const FinancialAgentStateSchema = new Schema(
    {
        agentId: {
            type: Schema.Types.ObjectId,
            ref: 'FinancialAgent',
            required: true,
            unique: true,   // one state doc per agent
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },

        balances: {
            type: [AssetBalanceSchema],
            default: [],
        },

        totalUsdValue: { type: String },
        totalNativeAmount: { type: String },

        lastFullSyncAt: { type: Date },
        isSyncing: { type: Boolean, default: false },
        lastEventAt: { type: Date },
        lastExecutionAt: { type: Date },
        metadata: { type: Schema.Types.Mixed, default: {} },

        counters: { type: Map, of: String, default: {} },
        pendingApprovalIds: [{ type: Schema.Types.ObjectId }],

        dailySpent: { type: Map, of: String, default: {} },
        weeklySpent: { type: Map, of: String, default: {} },
        monthlySpent: { type: Map, of: String, default: {} },

        spendWindowResetAt: {
            daily: { type: Date },
            weekly: { type: Date },
            monthly: { type: Date },
        },
    },
    { timestamps: true }
);

export const FinancialAgentState = mongoose.model<IFinancialAgentState>(
    'FinancialAgentState',
    FinancialAgentStateSchema
);
