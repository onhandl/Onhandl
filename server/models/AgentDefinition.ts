import mongoose, { Schema, Document, Types } from 'mongoose';
import { CharacterSchema } from '../characters/schema';

export interface IAgentDefinition extends Document {
    ownerId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    description?: string;
    character?: CharacterSchema;
    identities: Record<string, any>; // Chain specific traits (addresses, lock scripts)
    memory: Record<string, any>; // Persistent agent memory
    modelProvider: 'gemini' | 'openai';
    modelConfig: {
        modelName: string;
        temperature?: number;
        maxTokens?: number;
    };
    isActive: boolean;
    isDraft: boolean;
    persona?: string; // Original persona summary provided by user
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
        identities: { type: Schema.Types.Mixed, default: {} },
        memory: { type: Schema.Types.Mixed, default: {} },
        modelProvider: { type: String, enum: ['gemini', 'openai'], default: 'gemini' },
        modelConfig: {
            modelName: { type: String, default: 'gemini-1.5-flash' },
            temperature: { type: Number, default: 0.7 },
            maxTokens: { type: Number },
        },
        isActive: { type: Boolean, default: true },
        isDraft: { type: Boolean, default: true },
        persona: { type: String },
    },
    { timestamps: true }
);

export const AgentDefinition = mongoose.model<IAgentDefinition>('AgentDefinition', AgentDefinitionSchema);
