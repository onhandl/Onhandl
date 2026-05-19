import mongoose, { Schema, Document } from 'mongoose';

export interface IDeveloperApiKey extends Document {
    userId: string;
    workspaceId: string;
    name: string;
    keyPrefix: string;
    hashedKey: string;
    scopes: string[];
    lastUsedAt?: Date;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeveloperApiKeySchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        name: { type: String, required: true },
        keyPrefix: { type: String, required: true },
        hashedKey: { type: String, required: true },
        scopes: [{ type: String }],
        lastUsedAt: { type: Date },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Date },
    },
    { timestamps: true }
);

// Index for fast lookup
DeveloperApiKeySchema.index({ keyPrefix: 1 });

export const DeveloperApiKey = mongoose.model<IDeveloperApiKey>('DeveloperApiKey', DeveloperApiKeySchema);
