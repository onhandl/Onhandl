import mongoose, { Document, Schema, Types } from 'mongoose';
import {
    FINANCIAL_EVENT_TYPES,
    FinancialEventType,
    PolicyAction,
    PolicyCondition,
} from '../../../core/financial-runtime/types';

export interface IFinancialPolicy extends Document {
    agentId: Types.ObjectId;
    trigger: FinancialEventType;
    conditions: PolicyCondition[];
    actions: PolicyAction[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

const FinancialPolicySchema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'FinancialAgent', required: true, index: true },
        trigger: {
            type: String,
            enum: FINANCIAL_EVENT_TYPES,
            required: true,
            index: true,
        },
        conditions: { type: [Schema.Types.Mixed], default: [] },
        actions: { type: [Schema.Types.Mixed], default: [] },
        enabled: { type: Boolean, default: true, index: true },
        priority: { type: Number, default: 1, index: true },
    },
    { timestamps: true }
);

export const FinancialPolicy = mongoose.model<IFinancialPolicy>('FinancialPolicy', FinancialPolicySchema);
