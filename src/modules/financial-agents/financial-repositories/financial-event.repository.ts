import mongoose from 'mongoose';
import { FinancialEvent, IFinancialEvent } from '../../../infrastructure/database/models/FinancialEvent';

export const FinancialEventRepository = {
    async create(data: Partial<IFinancialEvent>) {
        return FinancialEvent.create(data);
    },

    async findRecentByAgent(agentId: string, workspaceId: string, limit = 25): Promise<IFinancialEvent[]> {
        if (!mongoose.Types.ObjectId.isValid(agentId) || !mongoose.Types.ObjectId.isValid(workspaceId)) return [];
        return FinancialEvent.find({ agentId, workspaceId }).sort({ createdAt: -1 }).limit(limit);
    },

    async findRecentByWorkspace(workspaceId: string, limit = 50): Promise<IFinancialEvent[]> {
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) return [];
        return FinancialEvent.find({ workspaceId }).sort({ createdAt: -1 }).limit(limit);
    },
};
