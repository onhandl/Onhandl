import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFinancialAgentState extends Document {
    agentId: Types.ObjectId;
    balances: Record<string, string>;
    counters: {
        monthlySpend: string;
        totalReceived: string;
    };
    pendingApprovalIds: Types.ObjectId[];
    lastEventAt?: Date;
    lastExecutionAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const FinancialAgentStateSchema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'FinancialAgent', required: true, unique: true, index: true },
        balances: { type: Schema.Types.Mixed, default: {} },
        counters: {
            monthlySpend: { type: String, default: '0' },
            totalReceived: { type: String, default: '0' },
        },
        pendingApprovalIds: [{ type: Schema.Types.ObjectId, ref: 'ApprovalRequest' }],
        lastEventAt: { type: Date },
        lastExecutionAt: { type: Date },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const FinancialAgentState = mongoose.model<IFinancialAgentState>('FinancialAgentState', FinancialAgentStateSchema);
