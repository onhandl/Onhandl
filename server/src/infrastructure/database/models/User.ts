import mongoose, { Schema, Document } from 'mongoose';
import type { PlanId, BillingCycle } from '../../../shared/constants/tokens';

interface IUser extends Document {
    walletAddress?: string;
    email?: string;
    username?: string;
    password?: string;
    name?: string;
    whatsapp?: string;
    telegramUsername?: string;
    telegram?: {
        userId?: string;
        chatId?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        linkedAt?: Date;
        lastAuthAt?: Date;
        permissions?: {
            notifications: boolean;
            write: boolean;
        };
    };
    avatarUrl?: string;
    bio?: string;
    profileViews: number;
    isEmailVerified: boolean;
    isAdmin: boolean;
    tokens: number;
    plan: PlanId;
    planExpiry?: Date;
    planBillingCycle?: BillingCycle;
    notifications?: { telegram: boolean; whatsapp: boolean; dailySummaries: boolean; email: boolean };
    savedPaymentMethods?: {
        crypto: Array<{ label: string; network: string; walletAddress: string; asset: string }>;
    };
    apiKeys?: {
        gemini?: string;
        openai?: string;
        openaiBaseUrl?: string;
        openaiModel?: string;
        ollamaBaseUrl?: string;
        ollamaModel?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        walletAddress: { type: String, unique: true, sparse: true },
        email: { type: String, unique: true, sparse: true },
        username: { type: String, unique: true, sparse: true },
        password: { type: String },
        name: { type: String },
        whatsapp: { type: String },
        telegramUsername: { type: String },
        telegram: {
            userId: { type: String },
            chatId: { type: String },
            username: { type: String },
            firstName: { type: String },
            lastName: { type: String },
            linkedAt: { type: Date },
            lastAuthAt: { type: Date },
            permissions: {
                notifications: { type: Boolean, default: false },
                write: { type: Boolean, default: false },
            },
        },
        avatarUrl: { type: String, default: '' },
        bio: { type: String, maxlength: 500 },
        profileViews: { type: Number, default: 0 },
        isEmailVerified: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        tokens: { type: Number, default: 0 },
        plan: { type: String, enum: ['free', 'starter', 'pro', 'max', 'enterprise', 'unlimited'], default: 'free' },
        planExpiry: { type: Date },
        planBillingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
        notifications: {
            telegram: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            dailySummaries: { type: Boolean, default: false },
            email: { type: Boolean, default: true },
        },
        savedPaymentMethods: {
            crypto: [{
                label: { type: String },
                network: { type: String },
                walletAddress: { type: String },
                asset: { type: String },
            }],
        },
        apiKeys: {
            gemini: { type: String },
            openai: { type: String },
            openaiBaseUrl: { type: String },
            openaiModel: { type: String },
            ollamaBaseUrl: { type: String },
            ollamaModel: { type: String },
        },
    },
    { timestamps: true }
);

UserSchema.index({ 'telegram.userId': 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
