import mongoose, { Schema, Document, Types } from 'mongoose';
import { CharacterSchema } from '../../../core/characters/schema';

type AgentType = 'financial_agent' | 'social_agent' | 'operational_agent';

type Blockchain = {
    network: string;
    rpcUrl?: string;
    walletAddress?: string;
    publicKey?: string;
    privateKey?: string;
    walletType?: 'managed' | 'externally_owned';
    peerId?: string;
};

interface IAgentDefinition extends Document {
    ownerId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    description?: string;
    character?: CharacterSchema;
    agentType?: AgentType;
    identities: Record<string, any>;
    memory: Record<string, any>;
    modelProvider: 'gemini' | 'openai' | 'ollama' | 'anthropic';
    modelConfig: { modelName: string; temperature?: number; maxTokens?: number };
    isActive: boolean;
    isDraft: boolean;
    status: 'running' | 'stopped';
    persona?: string;
    blockchain?: Blockchain[];
    createdAt: Date;
    updatedAt: Date;
}

const AgentDefinitionSchema: Schema = new Schema(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        name: { type: String, required: true },
        description: { type: String },
        character: { type: Schema.Types.Mixed },
        agentType: {
            type: String,
            enum: ['financial_agent', 'social_agent', 'operational_agent'],
            default: 'operational_agent',
        },
        identities: { type: Schema.Types.Mixed, default: {} },
        memory: { type: Schema.Types.Mixed, default: {} },
        modelProvider: { type: String, enum: ['gemini', 'openai', 'ollama', 'anthropic'], default: 'ollama' },
        modelConfig: {
            modelName: { type: String, default: 'qwen2.5:3b' },
            temperature: { type: Number, default: 0.7 },
            maxTokens: { type: Number },
        },
        isActive: { type: Boolean, default: true },
        isDraft: { type: Boolean, default: true },
        status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
        persona: { type: String },
        blockchain: [
            {
                network: { type: String },
                rpcUrl: { type: String },
                walletAddress: { type: String },
                publicKey: { type: String },
                privateKey: { type: String },
                walletType: { type: String, enum: ['managed', 'externally_owned'] },
                peerId: { type: String },
            },
        ],
    },
    { timestamps: true }
);

export const AgentDefinition = mongoose.model<IAgentDefinition>('AgentDefinition', AgentDefinitionSchema);
