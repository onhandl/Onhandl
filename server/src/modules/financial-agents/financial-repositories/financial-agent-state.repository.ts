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

    async upsertByAgentId(
        agentId: string,
        update: Partial<IFinancialAgentState>,
        setOnInsert?: Partial<IFinancialAgentState>,
    ) {
        if (!mongoose.Types.ObjectId.isValid(agentId)) return null;
        const op: Record<string, unknown> = { $set: update };
        if (setOnInsert && Object.keys(setOnInsert).length > 0) {
            op.$setOnInsert = setOnInsert;
        }
        return FinancialAgentState.findOneAndUpdate(
            { agentId },
            op,
            { upsert: true, new: true, runValidators: true },
        );
    },
};
