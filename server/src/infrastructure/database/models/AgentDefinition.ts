import mongoose, { Schema, Document, Types } from 'mongoose';
import { CharacterSchema } from '../../../core/characters/schema';

interface IAgentDefinition extends Document {
    ownerId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    description?: string;
    agentType: 'financial_agent' | 'social_agent' | 'operational_agent';
    character?: CharacterSchema;
    identities: Record<string, any>;
    memory: Record<string, any>;
    modelProvider: 'gemini' | 'openai' | 'ollama';
    modelConfig: { modelName: string; temperature?: number; maxTokens?: number };
    isActive: boolean;
    isDraft: boolean;
    // Agent control — start/stop super-command state
    status: 'running' | 'stopped';
    persona?: string;
    blockchain?: {
        network: string;
        rpcUrl?: string;
        walletAddress?: string;
        publicKey?: string;
        privateKey?: string;
        walletType?: 'managed' | 'externally_owned';
        peerId?: string;
    }[];
    graph: { nodes: any[]; edges: any[] };
    exportSettings?: {
        embedEnabled: boolean;
        allowedDomains: string[];
        allowedIPs: string[];
        theme: string;
        pwaDownloadCount: number;
        lastExportedAt: Date;
        mcpEnabled: boolean;
    };
    // Marketplace — Mixed so subdoc casting never fails
    marketplace?: any;
    createdAt: Date;
    updatedAt: Date;
}

const AgentDefinitionSchema: Schema = new Schema(
    {
        ownerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workspaceId:{ type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        name:       { type: String, required: true },
        description:{ type: String },
        agentType: {
            type: String,
            enum: ['financial_agent', 'social_agent', 'operational_agent'],
            default: 'operational_agent',
        },
        character:  { type: Schema.Types.Mixed },
        identities: { type: Schema.Types.Mixed, default: {} },
        memory:     { type: Schema.Types.Mixed, default: {} },
        modelProvider: { type: String, enum: ['gemini', 'openai', 'ollama'], default: 'ollama' },
        modelConfig: {
            modelName:   { type: String, default: 'qwen2.5:3b' },
            temperature: { type: Number, default: 0.7 },
            maxTokens:   { type: Number },
        },
        isActive: { type: Boolean, default: true },
        isDraft:  { type: Boolean, default: true },
        status:   { type: String, enum: ['running', 'stopped'], default: 'stopped' },
        persona:  { type: String },
        blockchain: [
            {
                network:     { type: String },
                rpcUrl:      { type: String },
                walletAddress:{ type: String },
                publicKey:   { type: String },
                privateKey:  { type: String },
                walletType:  { type: String, enum: ['managed', 'externally_owned'] },
                peerId:      { type: String }, // Fiber/CKB peer ID for discovery
            },
        ],
        graph:      { type: Schema.Types.Mixed, default: { nodes: [], edges: [] } },
        // Single Mixed marketplace field — no duplicate declaration
        marketplace: { type: Schema.Types.Mixed, default: null },
        exportSettings: {
            embedEnabled:      { type: Boolean, default: false },
            allowedDomains:    [{ type: String }],
            allowedIPs:        [{ type: String }],
            theme:             { type: String, default: 'dark' },
            pwaDownloadCount:  { type: Number, default: 0 },
            lastExportedAt:    { type: Date },
            mcpEnabled:        { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

export const AgentDefinition = mongoose.model<IAgentDefinition>('AgentDefinition', AgentDefinitionSchema);
