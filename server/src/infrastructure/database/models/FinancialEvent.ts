import mongoose, { Document, Schema, Types } from 'mongoose';
import { FinancialEventType, FINANCIAL_EVENT_TYPES } from '../../../core/financial-runtime/types';

export interface IFinancialEvent extends Document {
    eventId: string;
    type: FinancialEventType;
    workspaceId: Types.ObjectId;
    agentId?: Types.ObjectId;
    source: string;
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
}

const FinancialEventSchema = new Schema(
    {
        eventId: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: FINANCIAL_EVENT_TYPES,
            required: true,
            index: true,
        },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        agentId: { type: Schema.Types.ObjectId, ref: 'FinancialAgent', index: true },
        source: { type: String, required: true },
        payload: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const FinancialEvent = mongoose.model<IFinancialEvent>('FinancialEvent', FinancialEventSchema);
