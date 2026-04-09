import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGossipSubscription extends Document {
    agentId: Types.ObjectId;
    ownerId: Types.ObjectId;
    catalog: string;          // e.g. "defi", "social", "operations"
    interfaces: string[];     // specific interfaces the agent exposes
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const GossipSubscriptionSchema: Schema = new Schema(
    {
        agentId:    { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true, unique: true },
        ownerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        catalog:    { type: String, required: true },
        interfaces: [{ type: String }],
        status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
    },
    { timestamps: true }
);

export const GossipSubscription = mongoose.model<IGossipSubscription>('GossipSubscription', GossipSubscriptionSchema);
