import { MatchedPolicy, RuntimeEvent } from './types';
import { FinancialPolicyRepository } from '../../modules/financial-agents/financial-repositories/financial-policy.repository';
import { ConditionEvaluator } from './ConditionEvaluator';

export class PolicyEngine {
    async match(agentId: string, event: RuntimeEvent): Promise<MatchedPolicy[]> {
        const policies = await FinancialPolicyRepository.findEnabledByAgentAndTrigger(agentId, event.type);

        const context = {
            ...event.payload,
            eventType: event.type,
            workspaceId: event.workspaceId,
            source: event.source,
        };

        return policies
            .filter((policy) => ConditionEvaluator.evaluate(policy.conditions || [], context))
            .map((policy) => ({
                policyId: String(policy._id),
                priority: policy.priority,
                actions: policy.actions,
            }))
            .sort((a, b) => a.priority - b.priority);
    }
}
