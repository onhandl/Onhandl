import mongoose, { Schema, Document } from 'mongoose';

interface IBlogPost extends Document {
    title: string;
    body: string;
    tags: string[];
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    postType: 'official' | 'community';
    status: 'published' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        tags: [{ type: String }],
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        postType: { type: String, enum: ['official', 'community'], default: 'community' },
        status: { type: String, enum: ['published', 'draft'], default: 'published' },
    },
    { timestamps: true }
);

export const BlogPost = mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
