import { PLANS, PlanId } from '../constants/tokens';
import { User } from '../../infrastructure/database/models/User';

/**
 * Resolves the PlanId for a given userId.
 * Use this as the single user-plan lookup across all services.
 */
export async function getUserPlan(userId: string): Promise<PlanId> {
    const user = await User.findById(userId).select('plan').lean();
    if (!user) throw { code: 404, message: 'User not found' };
    return ((user as any).plan as PlanId) || 'free';
}

/**
 * Returns the full feature set for a plan.
 */
export function getPlanFeatures(planId: PlanId) {
    return PLANS[planId] ?? PLANS.free;
}

// ── Assertion Helpers ─────────────────────────────────────────────────────────

export function assertAgentLimit(planId: PlanId, currentCount: number) {
    const plan = getPlanFeatures(planId);
    if (plan.agentLimit !== -1 && currentCount >= plan.agentLimit) {
        throw {
            code: 403,
            message: `Your ${plan.name} plan allows up to ${plan.agentLimit} AI agent${plan.agentLimit === 1 ? '' : 's'}. Upgrade your plan to create more.`,
        };
    }
}

export function assertCanDelete(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canDelete) {
        throw {
            code: 403,
            message: `Deleting agents is not available on the ${plan.name} plan. Upgrade to Starter or above to delete agents.`,
        };
    }
}

export function assertCanReEdit(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canReEdit) {
        throw {
            code: 403,
            message: `Re-editing agents is not available on the ${plan.name} plan. Upgrade to Starter or above to edit agents.`,
        };
    }
}

export function assertTemplateAccess(planId: PlanId, templateTier: 'basic' | 'premium') {
    const plan = getPlanFeatures(planId);
    if (templateTier === 'premium' && plan.templatesAccess !== 'all') {
        throw {
            code: 403,
            message: `Premium templates are not available on the ${plan.name} plan. Upgrade to Starter or above to access all templates.`,
        };
    }
}

export function assertMarketplacePublish(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canPublishMarketplace) {
        throw {
            code: 403,
            message: `Marketplace publishing is available on Starter and above. Upgrade your plan to publish agents.`,
        };
    }
}

export function assertRevenueDashboard(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canAccessRevenueDashboard) {
        throw {
            code: 403,
            message: `Revenue dashboard is available on Pro and Unlimited plans only. Upgrade to access revenue analytics.`,
        };
    }
}

export function assertAdvancedAnalytics(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canAccessAdvancedAnalytics) {
        throw {
            code: 403,
            message: `Advanced analytics are available on Pro and Unlimited plans only. Upgrade to access detailed agent statistics.`,
        };
    }
}

export function assertCustomIntegrations(planId: PlanId) {
    const plan = getPlanFeatures(planId);
    if (!plan.canUseCustomIntegrations) {
        throw {
            code: 403,
            message: `Custom integrations are available on the Unlimited plan only. Upgrade to unlock this feature.`,
        };
    }
}
