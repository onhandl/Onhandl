import { eventBus } from '../../../eventBus';
import { TransferTool } from '../../../../../infrastructure/blockchain/ckb';
import type { ExecutableAction } from '../../../types';
import type { ActionExecutorHandler, ExecutorContext } from '../../executor.types';

type CkbTransferAction = Extract<ExecutableAction, { type: 'TRANSFER_FUNDS' }>;

export class CkbTransferExecutor implements ActionExecutorHandler<CkbTransferAction> {
  canHandle(action: ExecutableAction): action is CkbTransferAction {
    return action.type === 'TRANSFER_FUNDS' && action.config.chain === 'CKB' && action.config.asset === 'CKB';
  }

  async execute(context: ExecutorContext<CkbTransferAction>): Promise<void> {
    const { agent, agentId, event, action, createdAt } = context;

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

    if (!agent) {
      throw new Error('CKB transfer requires full agent context');
    }

    const networkCfg = agent.networkConfigs?.find((cfg) => cfg.network === 'CKB');

    if (!networkCfg?.wallet?.privateKey) {
      throw new Error('Missing CKB managed wallet private key');
    }

    const amount = Number(action.config.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid CKB transfer amount: ${action.config.amount}`);
    }

    const txHash = await TransferTool.execute({
      from: networkCfg.wallet.address,
      to: action.config.to,
      amount,
      privateKey: networkCfg.wallet.privateKey,
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