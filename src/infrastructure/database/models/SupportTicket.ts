import mongoose, { Schema, Document } from 'mongoose';

interface ISupportTicket extends Document {
    userId: mongoose.Types.ObjectId;
    userEmail: string;
    userName: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userEmail: { type: String, required: true },
        userName: { type: String, required: true },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        adminNotes: { type: String },
    },
    { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
