import mongoose from 'mongoose';
import { FinancialAgentState, IFinancialAgentState } from '../../../infrastructure/database/models/FinancialAgentState';

export const FinancialAgentStateRepository = {
    async findByAgentId(agentId: string) {
        if (!mongoose.Types.ObjectId.isValid(agentId)) return null;
        return FinancialAgentState.findOne({ agentId });
    },

    async create(data: Partial<IFinancialAgentState>) {
        return FinancialAgentState.create(data);
    },

    async save(state: IFinancialAgentState) {
        return state.save();
    },

    async upsertByAgentId(agentId: string, update: Partial<IFinancialAgentState>) {
        if (!mongoose.Types.ObjectId.isValid(agentId)) return null;
        return FinancialAgentState.findOneAndUpdate(
            { agentId },
            { $set: update },
            { upsert: true, new: true }
        );
    },
};
