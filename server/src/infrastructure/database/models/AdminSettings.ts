import mongoose, { Schema, Document } from 'mongoose';

interface IAdminSettings extends Document {
    cmsFrozen: boolean;
    cmsFrozenReason?: string;
    updatedAt: Date;
}

const AdminSettingsSchema: Schema = new Schema(
    {
        cmsFrozen: { type: Boolean, default: false },
        cmsFrozenReason: { type: String },
    },
    { timestamps: true }
);

export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
