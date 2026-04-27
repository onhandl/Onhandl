import mongoose from 'mongoose';
import { ApprovalEngine } from './ApprovalEngines/ApprovalEngine';
import { ActionExecutor } from './ActionExecutors';
import { ActionPlanner } from './ActionPlanners/ActionPlanner';
import { PolicyEngine } from './PolicyEngine';
import { PermissionEngine } from './PermissionEngines/PermissionEngine';
import { RuntimeEvent } from './types';
import { FinancialAgentRepository } from '../../modules/financial-agents/financial-repositories/financial-agent.repository';
import { FinancialEventRepository } from '../../modules/financial-agents/financial-repositories/financial-event.repository';
import { FinancialAgentStateRepository } from '../../modules/financial-agents/financial-repositories/financial-agent-state.repository';
import { syncAgentBalances } from './AgentBalances';

export class AgentRuntime {
    constructor(
        private policyEngine = new PolicyEngine(),
        private actionPlanner = new ActionPlanner(),
        private permissionEngine = new PermissionEngine(),
        private approvalEngine = new ApprovalEngine(),
        private actionExecutor = new ActionExecutor()
    ) { }

    async processEvent(event: RuntimeEvent): Promise<void> {
        const persistedEvent = await FinancialEventRepository.create({
            type: event.type,
            eventId: event.id,
            workspaceId: new mongoose.Types.ObjectId(event.workspaceId),
            agentId: event.agentId && mongoose.Types.ObjectId.isValid(event.agentId)
                ? new mongoose.Types.ObjectId(event.agentId)
                : undefined,
            source: event.source,
            payload: event.payload,
        });

        const agents = event.agentId
            ? [await FinancialAgentRepository.findByIdInWorkspace(event.agentId, event.workspaceId)].filter(Boolean)
            : await FinancialAgentRepository.findSubscribedToEvent(event.workspaceId, event.type);

        for (const agent of agents) {
            if (!agent) continue;

            const state = await FinancialAgentStateRepository.findByAgentId(String(agent._id));
            const matchedPolicies = await this.policyEngine.match(String(agent._id), event);
            let executedActions = 0;

            for (const matched of matchedPolicies) {
                const plannedActions = this.actionPlanner.plan(event, matched.actions);

                for (const action of plannedActions) {
                    const permission = this.permissionEngine.check(action, agent);
                    if (!permission.allowed) continue;

                    const approvalResult = await this.approvalEngine.requiresApproval(
                        String(agent._id),
                        action,
                        agent
                    );
                    if (approvalResult.required) {
                        if (approvalResult.requestId && state) {
                            state.pendingApprovalIds.push(new mongoose.Types.ObjectId(approvalResult.requestId));
                            await FinancialAgentStateRepository.save(state);
                        }
                        continue;
                    }

                    await this.actionExecutor.execute(agent, action, {
                        ...event,
                        id: event.id || String(persistedEvent._id),
                    });
                    executedActions += 1;
                }
            }

            await FinancialAgentStateRepository.upsertByAgentId(
                String(agent._id),
                {
                    lastEventAt: new Date(event.createdAt || Date.now()),
                    ...(executedActions > 0 ? { lastExecutionAt: new Date() } : {}),
                },
                // Provide required fields only when the document is newly created
                {
                    workspaceId: agent.workspaceId,
                    balances: [],
                    counters: { monthlySpend: '0', totalReceived: '0' },
                    pendingApprovalIds: [],
                    metadata: {},
                } as any,
            );

            // Proactively refresh balances when funds arrive so the cached
            // state is immediately up-to-date for subsequent policies / UI.
            if (event.type === 'FUNDS.RECEIVED') {
                syncAgentBalances(String(agent._id)).catch((err) =>
                    console.error(`[AgentRuntime] balance sync failed for agent ${agent._id}:`, err)
                );
            }
        }
    }
}
