import type { ExecutableAction } from '../types';
import type { ActionExecutorHandler, ExecutorContext } from './executor.types';
import { CkbTransferExecutor } from './blockchain/ckb';
import { RetainFundsExecutor } from './internal';

export class ActionExecutorRegistry {
  constructor(private readonly handlers: ActionExecutorHandler[] = [new CkbTransferExecutor(), new RetainFundsExecutor()]) {}

  resolve(action: ExecutableAction): ActionExecutorHandler {
    const handler = this.handlers.find((candidate) => candidate.canHandle(action));

    if (handler) {
      return handler;
    }

    const detail =
      action.type === 'TRANSFER_FUNDS'
        ? ` (chain=${action.config.chain}, asset=${action.config.asset})`
        : '';

    throw new Error(`No executor registered for action ${action.type}${detail}`);
  }

  async execute(context: ExecutorContext): Promise<void> {
    const handler = this.resolve(context.action);
    await handler.execute(context);
  }
}
