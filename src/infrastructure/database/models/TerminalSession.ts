import mongoose, { Document, Schema } from 'mongoose';

export interface ITerminalSession extends Document {
    deviceCode: string;
    userCode: string;
    status: 'pending' | 'approved' | 'denied' | 'expired';
    userId?: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    accessToken?: string; // legacy support, maybe remove later if raw is not stored
    hashedAccessToken?: string;
    deviceName?: string;
    revoked: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const terminalSessionSchema = new Schema<ITerminalSession>(
    {
        deviceCode: { type: String, required: true, unique: true },
        userCode: { type: String, required: true, unique: true },
        status: { type: String, enum: ['pending', 'approved', 'denied', 'expired'], default: 'pending' },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
        accessToken: { type: String },
        hashedAccessToken: { type: String },
        deviceName: { type: String, default: 'Unknown Device' },
        revoked: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

terminalSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired sessions

export const TerminalSession = mongoose.model<ITerminalSession>('TerminalSession', terminalSessionSchema);
