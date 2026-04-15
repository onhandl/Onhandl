import mongoose, { Schema, Document } from 'mongoose';

type OtpPurpose = 'signup' | 'forgot_password';

interface IOtp extends Document {
    email: string;
    code: string; // bcrypt-hashed OTP
    purpose: OtpPurpose;
    expiresAt: Date;
    used: boolean;
    // For signup: store pending registration data until verified
    pendingData?: {
        username?: string;
        password: string; // already bcrypt-hashed
        name?: string;
    };
}

const OtpSchema: Schema = new Schema(
    {
        email: { type: String, required: true, index: true },
        code: { type: String, required: true },
        purpose: { type: String, enum: ['signup', 'forgot_password'], required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false },
        pendingData: {
            username: { type: String },
            password: { type: String },
            name: { type: String },
        },
    },
    { timestamps: true }
);

// Auto-delete expired OTP documents
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
