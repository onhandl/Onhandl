import { eventBus } from '../../../infrastructure/events/eventBus';
import type { IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import type { ExecutableAction, RuntimeEvent } from '../types';
import { ActionExecutorRegistry } from './registry';

export class ActionExecutor {
  constructor(private readonly registry = new ActionExecutorRegistry()) {}

  async execute(agentOrAgentId: IFinancialAgent | string, action: ExecutableAction, event: RuntimeEvent): Promise<void> {
    const agent = typeof agentOrAgentId === 'string' ? undefined : agentOrAgentId;
    const agentId = typeof agentOrAgentId === 'string' ? agentOrAgentId : String(agentOrAgentId._id);
    const createdAt = Date.now();

    eventBus.emit('FINANCIAL_ACTION.STARTED', {
      agentId,
      type: action.type,
      eventId: event.id,
      workspaceId: event.workspaceId,
      payload: action,
      createdAt,
    });

    try {
      await this.registry.execute({
        agent,
        agentId,
        action,
        event,
        createdAt,
      });

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
