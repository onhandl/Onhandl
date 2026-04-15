import mongoose, { Schema, Document } from 'mongoose';

interface IToolRegistry extends Document {
    name: string;
    description: string;
    network: string; // E.g., CKB, Solana, Base
    category: string; // E.g., rpc, indexer, Fiber, etc.
    subCategory?: string; // Optional nested folder/grouping
    schemaDef: any;
    isActive: boolean;
}

const ToolRegistrySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    network: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    schemaDef: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const ToolRegistry = mongoose.model<IToolRegistry>('ToolRegistry', ToolRegistrySchema);
