import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKey extends Document {
    scope: string;
    key: string;
    status: 'processing' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
    lockedUntil?: Date;
    completedAt?: Date;
    failedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const IdempotencyKeySchema = new Schema(
    {
        scope: { type: String, required: true, index: true },
        key: { type: String, required: true },
        status: {
            type: String,
            enum: ['processing', 'completed', 'failed'],
            required: true,
            default: 'processing'
        },
        metadata: { type: Schema.Types.Mixed },
        lockedUntil: { type: Date },
        completedAt: { type: Date },
        failedAt: { type: Date },
    },
    { timestamps: true }
);

// Critical DB-level protection
IdempotencyKeySchema.index({ scope: 1, key: 1 }, { unique: true });

export const IdempotencyKey = mongoose.model<IIdempotencyKey>(
    'IdempotencyKey',
    IdempotencyKeySchema
);
