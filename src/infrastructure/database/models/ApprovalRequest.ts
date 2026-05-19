import mongoose, { Document, Schema, Types } from 'mongoose';
import { ExecutableAction } from '../../../core/financial-runtime/types';

export interface IApprovalRequest extends Document {
    agentId: Types.ObjectId;
    action: ExecutableAction;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    resolvedAt?: Date;
    updatedAt: Date;
}

const ApprovalRequestSchema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'FinancialAgent', required: true, index: true },
        action: { type: Schema.Types.Mixed, required: true },
        reason: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        resolvedAt: { type: Date },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

export const ApprovalRequest = mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
