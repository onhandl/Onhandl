/**
 * Token System — Onhandl Platform
 *
 * Tokens are the internal currency for AI operations.
 * Each node execution consumes 50 tokens. Each LLM call also deducts tokens.
 */

// ── Plan Definitions ──────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'max' | 'enterprise' | 'unlimited';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

interface Plan {
    id: PlanId;
    name: string;
    monthlyPrice: number;       // USD base price (monthly)
    agentLimit: number;         // max agents (-1 = unlimited)
    nodeLimit: number;          // max connected nodes per agent (-1 = unlimited)
    canDelete: boolean;
    canReEdit: boolean;
    tokenRefillMonthly: number; // tokens granted each month
    features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Free',
        monthlyPrice: 0,
        agentLimit: 3,
        nodeLimit: -1,
        canDelete: false,
        canReEdit: false,
        tokenRefillMonthly: 500,
        features: [
            'Up to 3 agents',
            'Max Infinite nodes per agent',
            '50 tokens per successful node execution',
            '500 tokens / month',
            'Community support',
            'Basic templates',
        ],
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        monthlyPrice: 8,
        agentLimit: 10,
        nodeLimit: -1,
        canDelete: true,
        canReEdit: true,
        tokenRefillMonthly: 5_000,
        features: [
            'Up to 10 agents',
            'Max Infinite nodes per agent',
            '50 tokens per successful node execution',
            '5,000 tokens / month',
            'Email support',
            'All templates',
            'Marketplace publishing',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 16,
        agentLimit: 100,
        nodeLimit: -1,
        canDelete: true,
        canReEdit: true,
        tokenRefillMonthly: 25_000,
        features: [
            'Up to 100 agents',
            'Max Infinite nodes per agent',
            '50 tokens per successful node execution',
            '25,000 tokens / month',
            'Priority support',
            'Custom personas',
            'Analytics dashboard',
            'Embed & PWA export',
        ],
    },
    max: {
        id: 'max',
        name: 'Max',
        monthlyPrice: 30,
        agentLimit: -1,
        nodeLimit: -1,
        canDelete: true,
        canReEdit: true,
        tokenRefillMonthly: 100_000,
        features: [
            'Unlimited agents',
            'Unlimited nodes per agent',
            '50 tokens per successful node execution',
            '100,000 tokens / month',
            'Dedicated support',
            'White-label embeds',
            'Revenue dashboard',
            'Custom billing',
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0, // custom pricing
        agentLimit: -1,
        nodeLimit: -1,
        canDelete: true,
        canReEdit: true,
        tokenRefillMonthly: -1, // custom
        features: [
            'Unlimited agents',
            'Unlimited nodes per agent',
            'Custom token allowance',
            'SLA support',
            'SSO / SAML',
            'Custom integrations',
            'Dedicated instance',
        ],
    },
    // kept for backward compat with existing DB records
    unlimited: {
        id: 'unlimited',
        name: 'Unlimited',
        monthlyPrice: 30,
        agentLimit: -1,
        nodeLimit: -1,
        canDelete: true,
        canReEdit: true,
        tokenRefillMonthly: 100_000,
        features: [
            'Unlimited agents',
            'Unlimited nodes per agent',
            '100,000 tokens / month',
            'Dedicated support',
            'Revenue dashboard',
        ],
    },
};

// ── Billing Discounts ─────────────────────────────────────────────────────────

const BILLING_DISCOUNTS: Record<BillingCycle, number> = {
    monthly: 0,
    quarterly: 0.10, // 10% off
    yearly: 0.25,    // 25% off
};

/**
 * Calculate final price for a plan + billing cycle.
 */
function calculatePrice(planId: PlanId, cycle: BillingCycle): {
    unitPrice: number;
    totalCharged: number;
    discount: number;
    months: number;
} {
    const plan = PLANS[planId];
    const discount = BILLING_DISCOUNTS[cycle];
    const months = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
    const unitPrice = plan.monthlyPrice * (1 - discount);
    const totalCharged = Math.round(unitPrice * months * 100) / 100;
    return { unitPrice, totalCharged, discount, months };
}

// ── Token Costs ───────────────────────────────────────────────────────────────

/** Platform token costs per operation */
const TOKEN_COSTS: Record<string, number> = {
    // Per connected node executed in a flow run
    node_execution: 50,
    // Character generation (one-off)
    enhance_persona: 50,
    // Per agent query
    agent_query: 5,
    // Embed/PWA chat
    embed_chat: 3,
    // Marketplace listing
    publish_agent: 10,
    // Export PWA download
    export_pwa: 5,
};

/** Tokens deducted for executing a flow with N connected nodes */
export function tokensForExecution(nodeCount: number): number {
    return nodeCount * TOKEN_COSTS.node_execution;
}

/** New-user welcome bonus */
export const WELCOME_TOKENS = 1_000;

/** Returns false if the user doesn't have enough tokens for an operation */
function canAfford(currentTokens: number, operation: keyof typeof TOKEN_COSTS): boolean {
    return currentTokens >= (TOKEN_COSTS[operation] ?? 0);
}

/** Returns false if the user can't afford to run N nodes */
function canAffordExecution(currentTokens: number, nodeCount: number): boolean {
    return currentTokens >= tokensForExecution(nodeCount);
}

/** Returns the node limit for a plan (-1 = unlimited) */
export function getNodeLimit(planId: PlanId): number {
    return (PLANS[planId] ?? PLANS.free).nodeLimit;
}
