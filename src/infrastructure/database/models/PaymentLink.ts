import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentLink extends Document {
    workspaceId: mongoose.Types.ObjectId;
    agentId?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    chain: string;
    asset: string;
    recipientAddress: string;
    signerAddress: string;
    amount: string;
    reference?: string;
    memo?: string;
    metadata?: Record<string, string>;
    link: string;
    status: "active" | "paid" | "expired" | "cancelled";
    expiresAt?: Date;
    fulfilledAt?: Date;
    txHash?: string;
    payerAddress?: string;
    paidAmount?: string;
    verificationData?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentLinkSchema: Schema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chain: { type: String, required: true },
    asset: { type: String, required: true },
    recipientAddress: { type: String, required: true },
    signerAddress: { type: String, required: true },
    amount: { type: String, required: true },
    reference: { type: String, index: true },
    memo: { type: String },
    metadata: { type: Map, of: String },
    link: { type: String, required: true },
    status: {
        type: String,
        enum: ["active", "paid", "expired", "cancelled"],
        default: "active",
        index: true
    },
    expiresAt: { type: Date },
    fulfilledAt: { type: Date },
    txHash: { type: String },
    payerAddress: { type: String },
    paidAmount: { type: String },
    verificationData: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const PaymentLink = mongoose.model<IPaymentLink>('PaymentLink', PaymentLinkSchema);
