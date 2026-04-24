import { eventBus } from '../../../infrastructure/events/eventBus';
import type { IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import { ExecutableAction, RuntimeEvent } from '../types';
import { TransferTool } from '../../../infrastructure/blockchain/ckb';

export class ActionExecutor {
  async execute(agent: IFinancialAgent, action: ExecutableAction, event: RuntimeEvent): Promise<void> {
    const createdAt = Date.now();
    const agentId = String(agent._id);

    eventBus.emit('FINANCIAL_ACTION.STARTED', {
      agentId,
      type: action.type,
      eventId: event.id,
      workspaceId: event.workspaceId,
      payload: action,
      createdAt,
    });

    try {
      if (action.type === 'TRANSFER_FUNDS') {
        eventBus.emit('FUNDS.TRANSFER_REQUESTED', {
          agentId,
          workspaceId: event.workspaceId,
          eventId: event.id,
          to: action.config.to,
          amount: action.config.amount,
          asset: action.config.asset,
          chain: action.config.chain,
          label: action.config.label,
          createdAt,
        });

        if (action.config.chain === 'CKB') {
          const networkCfg = agent.networkConfigs?.find((cfg) => cfg.network === 'CKB');

          if (!networkCfg?.wallet?.privateKey) {
            throw new Error('Missing CKB managed wallet private key');
          }

          if (action.config.asset !== 'CKB') {
            throw new Error(`Unsupported CKB transfer asset: ${action.config.asset}`);
          }

          const amount = Number(action.config.amount);

          if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error(`Invalid CKB transfer amount: ${action.config.amount}`);
          }

          const txHash = await TransferTool.execute({
            privateKey: networkCfg.wallet.privateKey,
            to: action.config.to,
            amount: amount,
            from: networkCfg.wallet.address,
          });

          eventBus.emit('FUNDS.TRANSFERRED', {
            agentId,
            workspaceId: event.workspaceId,
            eventId: event.id,
            to: action.config.to,
            amount: action.config.amount,
            asset: action.config.asset,
            chain: action.config.chain,
            label: action.config.label,
            txHash,
            createdAt: Date.now(),
          });
        }
      }

      if (action.type === 'RETAIN_FUNDS') {
        eventBus.emit('FUNDS.RETAINED', {
          agentId,
          workspaceId: event.workspaceId,
          eventId: event.id,
          amount: action.config.amount,
          label: action.config.label,
          createdAt,
        });
      }

      eventBus.emit('FINANCIAL_ACTION.EXECUTED', {
        agentId,
        type: action.type,
        eventId: event.id,
        workspaceId: event.workspaceId,
        payload: action,
      });

      eventBus.emit('FINANCIAL_ACTION.COMPLETED', {
        agentId,
        type: action.type,
        eventId: event.id,
        workspaceId: event.workspaceId,
        payload: action,
        createdAt: Date.now(),
      });
    } catch (error: any) {
      eventBus.emit('FINANCIAL_ACTION.FAILED', {
        agentId,
        type: action.type,
        eventId: event.id,
        workspaceId: event.workspaceId,
        payload: action,
        error: error?.message || 'Action execution failed',
        createdAt: Date.now(),
      });

      throw error;
    }
  }
}