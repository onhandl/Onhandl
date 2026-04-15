import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ioVersion tracks the node I/O contract version so existing saved agents
 * and future migrations can detect which schema a node was authored against.
 *
 * "1.0" = original flat outputData
 * "2.0" = NodeOutput<T> envelope (current)
 */
export interface IAgentNode extends Document {
  agentId: Types.ObjectId;
  nodeId: string;
  type: string;
  ioVersion: string;
  chain?: string;
  tool?: string;
  params: Record<string, unknown>;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AgentNodeSchema: Schema = new Schema(
  {
    agentId: { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
    nodeId: { type: String, required: true },
    type: { type: String, required: true },
    ioVersion: { type: String, default: '2.0' },
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

AgentNodeSchema.index({ agentId: 1, nodeId: 1 }, { unique: true });

export const AgentNode = mongoose.model<IAgentNode>('AgentNode', AgentNodeSchema);
