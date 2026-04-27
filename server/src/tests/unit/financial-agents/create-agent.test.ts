import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { FinancialAgentService } from '../../../modules/financial-agents/financial-services.ts/financial-agent.service';
import { FinancialAgentRepository } from '../../../modules/financial-agents/financial-repositories/financial-agent.repository';
import { FinancialAgentStateRepository } from '../../../modules/financial-agents/financial-repositories/financial-agent-state.repository';
import { FinancialPolicyRepository } from '../../../modules/financial-agents/financial-repositories/financial-policy.repository';
import { FinancialAgentValidationService } from '../../../modules/financial-agents/financial-services.ts/financial-agent-validation.service';
import * as ckbWalletTool from '../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_wallet_tool';

vi.mock('../../../modules/financial-agents/financial-repositories/financial-agent.repository');
vi.mock('../../../modules/financial-agents/financial-repositories/financial-agent-state.repository');
vi.mock('../../../modules/financial-agents/financial-repositories/financial-policy.repository');
vi.mock('../../../modules/financial-agents/financial-services.ts/financial-agent-validation.service');
vi.mock('../../../infrastructure/blockchain/ckb/ckb-specific-tools/ckb_wallet_tool');

describe('FinancialAgentService.createFromStructured', () => {
    const workspaceId = new mongoose.Types.ObjectId().toString();
    const agentId = new mongoose.Types.ObjectId();
    const stateId = new mongoose.Types.ObjectId();

    const mockDraft: any = {
        agent: {
            name: 'Test Agent',
            description: 'Test Description',
            subscribedEvents: ['FUNDS.RECEIVED'],
            permissionConfig: {
                allowedChains: ['CKB'],
                allowedActions: ['TRANSFER_FUNDS'],
            },
            approvalConfig: {
                fallbackRequireApprovalForNewRecipients: true,
            },
            networkConfigs: [{
                network: 'CKB',
                enabled: true,
                allowedAssets: ['CKB'],
                recipientPolicy: 'all',
            }],
        },
        policies: [{
            trigger: 'FUNDS.RECEIVED',
            conditions: [],
            actions: [{ type: 'TRANSFER_FUNDS', config: {} }],
        }],
        assumptions: ['Always test your code'],
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock validation service
        vi.mocked(FinancialAgentValidationService.validateDraft).mockResolvedValue(mockDraft);

        // Mock wallet tool
        vi.mocked(ckbWalletTool.generatePrivateKey).mockReturnValue('mock-private-key');
        vi.mocked(ckbWalletTool.getAddress).mockResolvedValue('mock-address');

        // Mock repositories
        vi.mocked(FinancialAgentRepository.create).mockResolvedValue({
            _id: agentId,
            ...mockDraft.agent,
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            save: vi.fn().mockResolvedValue({}),
        } as any);

        vi.mocked(FinancialAgentStateRepository.create).mockResolvedValue({
            _id: stateId,
            agentId: agentId,
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
        } as any);

        vi.mocked(FinancialPolicyRepository.create).mockResolvedValue({} as any);
    });

    it('should create an agent and its state with the correct workspaceId', async () => {
        const result = await FinancialAgentService.createFromStructured({
            mode: 'structured',
            workspaceId,
            draft: mockDraft,
        });

        // Verify Agent Creation
        expect(FinancialAgentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            name: 'Test Agent',
        }));

        // Verify State Creation - CRITICAL CHECK for the fix
        expect(FinancialAgentStateRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            agentId,
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
        }));

        // Verify Policy Creation
        expect(FinancialPolicyRepository.create).toHaveBeenCalledTimes(1);

        // Verify result structure
        expect(result.agent._id).toBe(agentId);
        expect(result.state._id).toBe(stateId);
    });

    it('should throw error for invalid workspace ID', async () => {
        await expect(FinancialAgentService.createFromStructured({
            mode: 'structured',
            workspaceId: 'invalid-id',
            draft: mockDraft,
        })).rejects.toMatchObject({
            code: 400,
            message: 'Invalid workspace ID',
        });
    });
});
