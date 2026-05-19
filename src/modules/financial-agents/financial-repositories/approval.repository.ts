import mongoose from 'mongoose';
import { ApprovalRequest, IApprovalRequest } from '../../../infrastructure/database/models/ApprovalRequest';

export const ApprovalRequestRepository = {
    async create(data: Partial<IApprovalRequest>) {
        return ApprovalRequest.create(data);
    },

    async findById(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return ApprovalRequest.findById(id);
    },

    async updateStatus(id: string, status: 'approved' | 'rejected') {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return ApprovalRequest.findByIdAndUpdate(
            id,
            { status, resolvedAt: new Date() },
            { new: true }
        );
    },

    async findPendingByAgent(agentId: string) {
        if (!mongoose.Types.ObjectId.isValid(agentId)) return [];
        return ApprovalRequest.find({ agentId, status: 'pending' }).sort({ createdAt: -1 });
    },
};
