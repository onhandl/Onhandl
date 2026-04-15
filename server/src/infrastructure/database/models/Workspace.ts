import mongoose, { Schema, Document, Types } from 'mongoose';

interface IWorkspace extends Document {
    name: string;
    ownerId: Types.ObjectId;
    members: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
