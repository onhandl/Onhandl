import mongoose, { Schema, Document, Types } from 'mongoose';

interface IReview extends Document {
    agentId:    Types.ObjectId;
    reviewerId: Types.ObjectId;
    rating:     number;          // 1–5
    comment:    string;
    createdAt:  Date;
    updatedAt:  Date;
}

const ReviewSchema: Schema = new Schema(
    {
        agentId:    { type: Schema.Types.ObjectId, ref: 'AgentDefinition', required: true },
        reviewerId: { type: Schema.Types.ObjectId, ref: 'User',            required: true },
        rating:     { type: Number, min: 1, max: 5, required: true },
        comment:    { type: String, trim: true, maxlength: 1000, default: '' },
    },
    { timestamps: true }
);

// One review per buyer per agent
ReviewSchema.index({ agentId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ agentId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
