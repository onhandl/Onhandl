import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAgentEdge extends Document {
    agentId: Types.ObjectId;
    edgeId: string; // The React Flow edge ID (e.g., 'e-1-2')
    source: string; // The source nodeId
    target: string; // The target nodeId
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    data?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const AgentEdgeSchema: Schema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        edgeId: { type: String, required: true },
        source: { type: String, required: true },
        target: { type: String, required: true },
        sourceHandle: { type: String },
        targetHandle: { type: String },
        label: { type: String },
        data: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// Index for fast retrieval of all edges in an agent
AgentEdgeSchema.index({ agentId: 1, edgeId: 1 }, { unique: true });

export const AgentEdge = mongoose.model<IAgentEdge>('AgentEdge', AgentEdgeSchema);
