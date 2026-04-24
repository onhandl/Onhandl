import { PLANS, PlanId } from '../constants/tokens';
import { User } from '../../infrastructure/database/models/User';
import { notFoundError, planLimitError } from '../errors';

/**
 * Resolves the PlanId for a given userId.
 * Use this as the single user-plan lookup across all services.
 */
export async function getUserPlan(userId: string): Promise<PlanId> {
    const user = await User.findById(userId).select('plan').lean();
    if (!user) throw notFoundError('User');
    return ((user as any).plan as PlanId) || 'free';
}

/**
 * Returns the full feature set for a plan.
 */
function getPlanFeatures(planId: PlanId) {
    return PLANS[planId] ?? PLANS.free;
}

// ── Assertion Helpers ─────────────────────────────────────────────────────────

export function assertAgentLimit(planId: PlanId, currentCount: number) {
    const plan = getPlanFeatures(planId);
    if (plan.agentLimit !== -1 && currentCount >= plan.agentLimit) {
        throw planLimitError(
            `Your ${plan.name} plan allows up to ${plan.agentLimit} AI agent${plan.agentLimit === 1 ? '' : 's'}. Upgrade your plan to create more.`
        );
    }
}

export function assertCanDelete(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canDelete) {
        throw planLimitError(
            `Deleting agents is not available on the ${plan.name} plan. Upgrade to Starter or above to delete agents.`
        );
    }
}

export function assertCanReEdit(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canReEdit) {
        throw planLimitError(
            `Re-editing agents is not available on the ${plan.name} plan. Upgrade to Starter or above to edit agents.`
        );
    }
}

function assertTemplateAccess(planId: PlanId, templateTier: 'basic' | 'premium') {
    const plan = getPlanFeatures(planId);
    if (templateTier === 'premium' && plan.templatesAccess !== 'all') {
        throw planLimitError(
            `Premium templates are not available on the ${plan.name} plan. Upgrade to Starter or above to access all templates.`
        );
    }
}

function assertAdvancedAnalytics(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canAccessAdvancedAnalytics) {
        throw planLimitError(
            `Advanced analytics are available on Pro and Unlimited plans only. Upgrade to access detailed agent statistics.`
        );
    }
}

function assertCustomIntegrations(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canUseCustomIntegrations) {
        throw planLimitError(
            `Custom integrations are available on the Unlimited plan only. Upgrade to unlock this feature.`
        );
    }
}
