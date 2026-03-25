import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAgentNode extends Document {
    agentId: Types.ObjectId;
    nodeId: string; // The React Flow node ID (e.g., 'input-1')
    type: string;
    chain?: string;
    tool?: string;
    params: Record<string, any>;
    position: {
        x: number;
        y: number;
    };
    data: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const AgentNodeSchema: Schema = new Schema(
    {
        agentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        nodeId: { type: String, required: true },
        type: { type: String, required: true },
        chain: { type: String },
        tool: { type: String },
        params: { type: Schema.Types.Mixed, default: {} },
        position: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
        },
        data: { type: Schema.Types.Mixed, default: {} },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Index for fast retrieval of all nodes in an agent
AgentNodeSchema.index({ agentId: 1, nodeId: 1 }, { unique: true });

export const AgentNode = mongoose.model<IAgentNode>('AgentNode', AgentNodeSchema);
