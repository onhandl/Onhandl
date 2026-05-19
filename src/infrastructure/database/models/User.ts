import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
    email: string;
    username: string;
    password?: string;
    name?: string;

    google?: {
        id: string;
        linkedAt?: Date;
        lastAuthAt?: Date;
    };

    telegram?: {
        userId: string;
        chatId: string;
        username: string;
        firstName?: string;
        lastName?: string;
        linkedAt?: Date;
        lastAuthAt?: Date;
        permissions?: {
            notifications: boolean;
            write: boolean;
        };
    };
    whatsapp?: {
        phoneNumber: string;
        userId: string;
        linkedAt?: Date;
        lastAuthAt?: Date;
        permissions?: {
            notifications: boolean;
            write: boolean;
        };
    };
    avatarUrl?: string;
    isEmailVerified: boolean;
    isAdmin: boolean;
    notifications?: { telegram: boolean; whatsapp: boolean; email: boolean };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, unique: true, required: true },
        username: { type: String, unique: true, required: true },
        password: { type: String, required: false },
        name: { type: String, required: false },
        google: {
            id: { type: String },
            linkedAt: { type: Date },
            lastAuthAt: { type: Date },
        },
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
        whatsapp: {
            phoneNumber: { type: String },
            userId: { type: String },
            linkedAt: { type: Date },
            lastAuthAt: { type: Date },
            permissions: {
                notifications: { type: Boolean, default: false },
                write: { type: Boolean, default: false },
            },
        },
        avatarUrl: { type: String, default: '' },
        isEmailVerified: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        notifications: {
            telegram: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            email: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

UserSchema.index({ 'google.id': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'telegram.userId': 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
