import mongoose, { Schema, Document, Types } from 'mongoose';

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

interface IExecutionRun extends Document {
    agentDefinitionId: Types.ObjectId;
    triggeredBy?: Types.ObjectId;
    status: ExecutionStatus;
    state: Record<string, any>;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ExecutionRunSchema: Schema = new Schema(
    {
        agentDefinitionId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
        state: { type: Schema.Types.Mixed, default: {} },
        error: { type: String },
        startedAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

export const ExecutionRun = mongoose.model<IExecutionRun>('ExecutionRun', ExecutionRunSchema);
