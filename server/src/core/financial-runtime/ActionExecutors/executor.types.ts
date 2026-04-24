import type { IFinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';
import type { ExecutableAction, RuntimeEvent } from '../types';

export interface ExecutorContext<TAction extends ExecutableAction = ExecutableAction> {
  agent?: IFinancialAgent;
  agentId: string;
  action: TAction;
  event: RuntimeEvent;
  createdAt: number;
}

export interface ActionExecutorHandler<TAction extends ExecutableAction = ExecutableAction> {
  canHandle(action: ExecutableAction): action is TAction;
  execute(context: ExecutorContext<TAction>): Promise<void>;
}
