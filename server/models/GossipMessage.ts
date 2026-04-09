import mongoose, { Schema, Document, Types } from 'mongoose';

export type GossipType =
    | 'capability_announce'
    | 'status'
    | 'offer'
    | 'task_claim'
    | 'result_update'
    | 'task_request';

export interface IGossipMessage extends Document {
    bubbleId: Types.ObjectId;
    fromAgentId: Types.ObjectId;
    fromAgentName: string;
    toAgentIds: Types.ObjectId[];   // empty = broadcast
    type: GossipType;
    payload: Record<string, any>;
    round: number;
    propagationCount: number;
    createdAt: Date;
}

const GossipMessageSchema: Schema = new Schema(
    {
        bubbleId:         { type: Schema.Types.ObjectId, ref: 'Bubble', required: true, index: true },
        fromAgentId:      { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        fromAgentName:    { type: String, required: true },
        toAgentIds:       [{ type: Schema.Types.ObjectId, ref: 'AgentDefinition' }],
        type:             {
            type: String,
            enum: ['capability_announce', 'status', 'offer', 'task_claim', 'result_update', 'task_request'],
            required: true,
        },
        payload:          { type: Schema.Types.Mixed, default: {} },
        round:            { type: Number, default: 0 },
        propagationCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// TTL: auto-delete gossip messages older than 7 days
GossipMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const GossipMessage = mongoose.model<IGossipMessage>('GossipMessage', GossipMessageSchema);
