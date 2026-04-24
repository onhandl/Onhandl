import mongoose from 'mongoose';
import type { IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import { ApprovalDecision, ExecutableAction } from '../types';
import { ApprovalRequestRepository } from '../../../modules/financial-agents/financial-repositories/approval.repository';

export class ApprovalEngine {
  async requiresApproval(
    agentId: string,
    action: ExecutableAction,
    agent: IFinancialAgent
  ): Promise<ApprovalDecision> {
    if (action.type === 'RETAIN_FUNDS') {
      return { required: false };
    }

    if (!('chain' in action.config)) {
      return { required: false };
    }

    const networkCfg = agent.networkConfigs?.find((cfg) => cfg.network === action.config.chain);
    if (!networkCfg) {
      return { required: false };
    }

    const fallback = agent.approvalConfig || {};

    if (action.type === 'TRANSFER_FUNDS') {
      const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.asset);

      const requireApprovalForNewRecipients =
        assetRule?.requireApprovalForNewRecipients ??
        fallback.fallbackRequireApprovalForNewRecipients ??
        false;

      if (
        requireApprovalForNewRecipients &&
        networkCfg.recipientPolicy !== 'allowlist'
      ) {
        const request = await this.createRequest(
          agentId,
          action,
          'Transfer to a non-allowlisted recipient requires approval'
        );
        return { required: true, requestId: String(request._id), reason: request.reason };
      }

      const threshold = assetRule?.requireApprovalAbove;
      if (threshold) {
        const amount = this.toNumber(action.config.amount);
        const limit = this.toNumber(threshold);

        if (amount !== null && limit !== null && amount > limit) {
          const request = await this.createRequest(
            agentId,
            action,
            `Transfer amount exceeds approval threshold for ${action.config.asset} on ${action.config.chain}`
          );
          return { required: true, requestId: String(request._id), reason: request.reason };
        }
      }
    }

    if (action.type === 'SWAP_FUNDS') {
      const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.fromAsset);

      const requireApprovalForSwaps =
        assetRule?.requireApprovalForSwaps ??
        fallback.fallbackRequireApprovalForSwaps ??
        false;

      if (requireApprovalForSwaps) {
        const request = await this.createRequest(
          agentId,
          action,
          'Swap action requires approval'
        );
        return { required: true, requestId: String(request._id), reason: request.reason };
      }

      const threshold = assetRule?.requireApprovalAbove;
      if (threshold) {
        const amount = this.toNumber(action.config.amount);
        const limit = this.toNumber(threshold);

        if (amount !== null && limit !== null && amount > limit) {
          const request = await this.createRequest(
            agentId,
            action,
            `Swap amount exceeds approval threshold for ${action.config.fromAsset} on ${action.config.chain}`
          );
          return { required: true, requestId: String(request._id), reason: request.reason };
        }
      }
    }

    if (action.type === 'INVEST_FUNDS') {
      const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.asset);

      const requireApprovalForInvestments =
        assetRule?.requireApprovalForInvestments ??
        fallback.fallbackRequireApprovalForInvestments ??
        false;

      if (requireApprovalForInvestments) {
        const request = await this.createRequest(
          agentId,
          action,
          'Investment action requires approval'
        );
        return { required: true, requestId: String(request._id), reason: request.reason };
      }

      const threshold = assetRule?.requireApprovalAbove;
      if (threshold) {
        const amount = this.toNumber(action.config.amount);
        const limit = this.toNumber(threshold);

        if (amount !== null && limit !== null && amount > limit) {
          const request = await this.createRequest(
            agentId,
            action,
            `Investment amount exceeds approval threshold for ${action.config.asset} on ${action.config.chain}`
          );
          return { required: true, requestId: String(request._id), reason: request.reason };
        }
      }
    }

    return { required: false };
  }

  private async createRequest(agentId: string, action: ExecutableAction, reason: string) {
    return ApprovalRequestRepository.create({
      agentId: new mongoose.Types.ObjectId(agentId),
      action,
      reason,
      status: 'pending',
    });
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
}