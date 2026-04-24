import { eventBus } from '../../../../infrastructure/events/eventBus';
import type { ExecutableAction } from '../../types';
import type { ActionExecutorHandler, ExecutorContext } from '../executor.types';

export class RetainFundsExecutor implements ActionExecutorHandler<Extract<ExecutableAction, { type: 'RETAIN_FUNDS' }>> {
  canHandle(action: ExecutableAction): action is Extract<ExecutableAction, { type: 'RETAIN_FUNDS' }> {
    return action.type === 'RETAIN_FUNDS';
  }

  async execute(context: ExecutorContext<Extract<ExecutableAction, { type: 'RETAIN_FUNDS' }>>): Promise<void> {
    const { agentId, event, action, createdAt } = context;

    eventBus.emit('FUNDS.RETAINED', {
      agentId,
      workspaceId: event.workspaceId,
      eventId: event.id,
      amount: action.config.amount,
      label: action.config.label,
      createdAt,
    });
  }
}
