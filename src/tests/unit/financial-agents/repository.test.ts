import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { FinancialAgentStateRepository } from '../../../modules/financial-agents/financial-repositories/financial-agent-state.repository';
import { FinancialAgentState } from '../../../infrastructure/database/models/FinancialAgentState';

vi.mock('../../../infrastructure/database/models/FinancialAgentState');

describe('FinancialAgentStateRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('upsertByAgentId', () => {
        const agentId = new mongoose.Types.ObjectId().toString();
        const update = {
            lastEventAt: new Date(),
            lastExecutionAt: new Date()
        };
        const setOnInsert = { workspaceId: new mongoose.Types.ObjectId() };

        it('should call findOneAndUpdate with correct operators and options', async () => {
            vi.mocked(FinancialAgentState.findOneAndUpdate).mockResolvedValue({} as any);

            await FinancialAgentStateRepository.upsertByAgentId(agentId, update, setOnInsert);

            expect(FinancialAgentState.findOneAndUpdate).toHaveBeenCalledWith(
                { agentId },
                {
                    $set: update,
                    $setOnInsert: setOnInsert,
                },
                { upsert: true, new: true, runValidators: true }
            );
        });

        it('should omit $setOnInsert if not provided', async () => {
            vi.mocked(FinancialAgentState.findOneAndUpdate).mockResolvedValue({} as any);

            await FinancialAgentStateRepository.upsertByAgentId(agentId, update);

            expect(FinancialAgentState.findOneAndUpdate).toHaveBeenCalledWith(
                { agentId },
                { $set: update },
                { upsert: true, new: true, runValidators: true }
            );
        });

        it('should return null for invalid agentId', async () => {
            const result = await FinancialAgentStateRepository.upsertByAgentId('invalid', update);
            expect(result).toBeNull();
            expect(FinancialAgentState.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });
});
