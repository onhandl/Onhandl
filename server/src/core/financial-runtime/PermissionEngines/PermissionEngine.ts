import type { IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import { ExecutableAction, PermissionCheckResult } from '../types';

export class PermissionEngine {
  check(action: ExecutableAction, agent: IFinancialAgent): PermissionCheckResult {
    if (action.type === 'RETAIN_FUNDS') {
      return { allowed: true };
    }

    const globalAllowedActions = new Set(agent.permissionConfig?.allowedActions || []);
    const globalBlockedActions = new Set(agent.permissionConfig?.blockedActions || []);
    const globalAllowedChains = new Set(agent.permissionConfig?.allowedChains || []);
    const globalBlockedChains = new Set(agent.permissionConfig?.blockedChains || []);

    if (globalBlockedActions.has(action.type)) {
      return { allowed: false, reason: `Action ${action.type} is globally blocked` };
    }

    if (globalAllowedActions.size > 0 && !globalAllowedActions.has(action.type)) {
      return { allowed: false, reason: `Action ${action.type} is not globally allowlisted` };
    }

    if ('chain' in action.config) {
      const chain = action.config.chain;

      if (globalBlockedChains.has(chain as any)) {
        return { allowed: false, reason: `Chain ${chain} is globally blocked` };
      }

      if (globalAllowedChains.size > 0 && !globalAllowedChains.has(chain as any)) {
        return { allowed: false, reason: `Chain ${chain} is not globally allowlisted` };
      }

      const networkCfg = agent.networkConfigs?.find((cfg) => cfg.network === chain);
      if (!networkCfg) {
        return { allowed: false, reason: `No network config found for ${chain}` };
      }

      if (!networkCfg.enabled) {
        return { allowed: false, reason: `Network ${chain} is disabled` };
      }

      const localAllowedActions = new Set(networkCfg.allowedActions || []);
      const localBlockedActions = new Set(networkCfg.blockedActions || []);

      if (localBlockedActions.has(action.type)) {
        return { allowed: false, reason: `Action ${action.type} is blocked on ${chain}` };
      }

      if (localAllowedActions.size > 0 && !localAllowedActions.has(action.type)) {
        return { allowed: false, reason: `Action ${action.type} is not allowlisted on ${chain}` };
      }

      const assets = this.assetsFromAction(action);
      const localAllowedAssets = new Set(networkCfg.allowedAssets || []);
      const localBlockedAssets = new Set(networkCfg.blockedAssets || []);

      for (const asset of assets) {
        if (localBlockedAssets.has(asset)) {
          return { allowed: false, reason: `Asset ${asset} is blocked on ${chain}` };
        }

        if (localAllowedAssets.size > 0 && !localAllowedAssets.has(asset)) {
          return { allowed: false, reason: `Asset ${asset} is not allowlisted on ${chain}` };
        }
      }

      if (action.type === 'TRANSFER_FUNDS') {
        const to = action.config.to;

        if (networkCfg.blockedRecipients?.includes(to)) {
          return { allowed: false, reason: `Recipient ${to} is blocked on ${chain}` };
        }

        if (
          networkCfg.recipientPolicy === 'allowlist' &&
          (!networkCfg.allowedRecipients || !networkCfg.allowedRecipients.includes(to))
        ) {
          return { allowed: false, reason: `Recipient ${to} is not allowlisted on ${chain}` };
        }

        const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.asset);
        if (assetRule?.maxSpendPerTx) {
          const amount = this.toNumber(action.config.amount);
          const maxPerTx = this.toNumber(assetRule.maxSpendPerTx);

          if (amount === null || maxPerTx === null) {
            return { allowed: false, reason: 'Invalid asset spend limit configuration' };
          }

          if (amount > maxPerTx) {
            return { allowed: false, reason: `Amount exceeds maxSpendPerTx for ${action.config.asset} on ${chain}` };
          }
        }
      }

      if (action.type === 'SWAP_FUNDS') {
        const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.fromAsset);
        if (assetRule?.maxSpendPerTx) {
          const amount = this.toNumber(action.config.amount);
          const maxPerTx = this.toNumber(assetRule.maxSpendPerTx);

          if (amount === null || maxPerTx === null) {
            return { allowed: false, reason: 'Invalid asset spend limit configuration' };
          }

          if (amount > maxPerTx) {
            return { allowed: false, reason: `Amount exceeds maxSpendPerTx for ${action.config.fromAsset} on ${chain}` };
          }
        }
      }

      if (action.type === 'INVEST_FUNDS') {
        const assetRule = networkCfg.assetLimits?.find((limit) => limit.asset === action.config.asset);
        if (assetRule?.maxSpendPerTx) {
          const amount = this.toNumber(action.config.amount);
          const maxPerTx = this.toNumber(assetRule.maxSpendPerTx);

          if (amount === null || maxPerTx === null) {
            return { allowed: false, reason: 'Invalid asset spend limit configuration' };
          }

          if (amount > maxPerTx) {
            return { allowed: false, reason: `Amount exceeds maxSpendPerTx for ${action.config.asset} on ${chain}` };
          }
        }
      }
    }

    return { allowed: true };
  }

  private assetsFromAction(action: ExecutableAction): string[] {
    if (action.type === 'SWAP_FUNDS') {
      return [action.config.fromAsset, action.config.toAsset];
    }

    if (action.type === 'TRANSFER_FUNDS' || action.type === 'INVEST_FUNDS') {
      return [action.config.asset];
    }

    return [];
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