import mongoose, { Schema, Document, Types } from 'mongoose';

interface IPurchase extends Document {
    agentId: Types.ObjectId;
    buyerId: Types.ObjectId;
    sellerId: Types.ObjectId;
    paymentMethod: 'stripe' | 'crypto';
    amount: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'failed';
    stripeSessionId?: string;
    cryptoTxHash?: string;
    network?: string;
    proxyAgentId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseSchema: Schema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        paymentMethod: { type: String, enum: ['stripe', 'crypto'], required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
        stripeSessionId: { type: String },
        cryptoTxHash: { type: String },
        network: { type: String },
        proxyAgentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition' },
    },
    { timestamps: true }
);

export const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);
