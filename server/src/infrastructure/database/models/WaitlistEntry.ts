import mongoose, { Schema, Document } from 'mongoose';

interface IWaitlistEntry extends Document {
    name: string;
    email: string;
    source?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WaitlistEntrySchema: Schema = new Schema(
    {
        name:   { type: String, required: true, trim: true },
        email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
        source: { type: String, default: 'landing' },
    },
    { timestamps: true }
);

WaitlistEntrySchema.index({ createdAt: -1 });

export const WaitlistEntry = mongoose.model<IWaitlistEntry>('WaitlistEntry', WaitlistEntrySchema);
