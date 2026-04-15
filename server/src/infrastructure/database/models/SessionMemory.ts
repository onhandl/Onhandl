import mongoose, { Schema, Document, Types } from 'mongoose';

interface ISessionMemory extends Document {
    sessionId: string;
    agentId: Types.ObjectId;
    userId: Types.ObjectId;
    context: Record<string, any>;
    messages: { role: string; content: string; timestamp: Date }[];
    createdAt: Date;
    updatedAt: Date;
}

const SessionMemorySchema: Schema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        agentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        context: { type: Schema.Types.Mixed, default: {} },
        messages: [{
            role: { type: String, enum: ['system', 'user', 'assistant', 'tool'] },
            content: { type: String },
            timestamp: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

export const SessionMemory = mongoose.model<ISessionMemory>('SessionMemory', SessionMemorySchema);
