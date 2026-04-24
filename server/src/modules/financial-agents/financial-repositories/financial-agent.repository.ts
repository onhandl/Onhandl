import mongoose from 'mongoose';
import { FinancialAgent, IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import { FinancialEventType, FinancialAgentStatus } from '../../../core/financial-runtime/types';

export const FinancialAgentRepository = {
    async findByIdInWorkspace(id: string, workspaceId: string) {
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(workspaceId)) return null;
        return FinancialAgent.findOne({ _id: id, workspaceId });
    },

    async findManyByWorkspace(workspaceId: string): Promise<IFinancialAgent[]> {
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) return [];
        return FinancialAgent.find({ workspaceId }).sort({ updatedAt: -1 });
    },

    async findSubscribedToEvent(workspaceId: string, eventType: FinancialEventType): Promise<IFinancialAgent[]> {
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) return [];
        return FinancialAgent.find({
            workspaceId,
            status: 'active',
            subscribedEvents: eventType,
        });
    },

    async findActiveWithNetwork(network: string): Promise<IFinancialAgent[]> {
        return FinancialAgent.find({
            status: 'active',
            'networkConfigs.network': network,
            'networkConfigs.enabled': true,
        });
    },

    async create(data: Partial<IFinancialAgent>) {
        return FinancialAgent.create(data);
    },

    async save(agent: IFinancialAgent) {
        return agent.save();
    },

    async updateStatusInWorkspace(id: string, workspaceId: string, status: FinancialAgentStatus) {
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(workspaceId)) return null;
        return FinancialAgent.findOneAndUpdate({ _id: id, workspaceId }, { status }, { new: true });
    },
};
