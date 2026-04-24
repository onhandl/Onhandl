import mongoose from 'mongoose';
import { FinancialPolicy, IFinancialPolicy } from '../../../infrastructure/database/models/FinancialPolicy';
import { FinancialEventType } from '../../../core/financial-runtime/types';

export const FinancialPolicyRepository = {
    async findEnabledByAgentAndTrigger(agentId: string, trigger: FinancialEventType): Promise<IFinancialPolicy[]> {
        if (!mongoose.Types.ObjectId.isValid(agentId)) return [];
        return FinancialPolicy.find({ agentId, trigger, enabled: true }).sort({ priority: 1, createdAt: 1 });
    },

    async create(data: Partial<IFinancialPolicy>) {
        return FinancialPolicy.create(data);
    },

    async update(id: string, update: Partial<IFinancialPolicy>) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return FinancialPolicy.findByIdAndUpdate(id, update, { new: true });
    },

    async delete(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return FinancialPolicy.findByIdAndDelete(id);
    },
};
