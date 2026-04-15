export const MARKETPLACE_CATEGORIES = [
    'Trading Bot',
    'Analytics',
    'DeFi Assistant',
    'Portfolio Manager',
    'Data Feed',
    'Custom',
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const MARKETPLACE_NETWORKS = ['Base', 'CKB', 'Stellar', 'All'] as const;

export type MarketplaceNetwork = (typeof MARKETPLACE_NETWORKS)[number];
