import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBubble extends Document {
    ownerId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    description?: string;
    agentIds: Types.ObjectId[];
    status: 'active' | 'paused' | 'archived';
    gossipInterval: number; // seconds between rounds
    fanout: number;         // peers informed per round
    requiredInterfaces: string[];  // soft compatibility filter
    messageCount: number;          // total gossip messages propagated
    createdAt: Date;
    updatedAt: Date;
}

const BubbleSchema: Schema = new Schema(
    {
        ownerId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workspaceId:    { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        name:           { type: String, required: true },
        description:    { type: String },
        agentIds:       [{ type: Schema.Types.ObjectId, ref: 'AgentDefinition' }],
        status:         { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
        gossipInterval: { type: Number, default: 8 },
        fanout:         { type: Number, default: 2 },
        requiredInterfaces: [{ type: String }],
        messageCount:       { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Bubble = mongoose.model<IBubble>('Bubble', BubbleSchema);
