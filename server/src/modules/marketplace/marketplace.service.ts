import { MarketplaceRepository } from './marketplace.repository';
import { MARKETPLACE_CATEGORIES } from '../../shared/contracts/marketplace';

export const MarketplaceService = {
    async listAgents(query: {
        category?: string;
        pricing?: 'free' | 'paid' | 'all';
        network?: string;
        search?: string;
        page?: string;
        limit?: string;
    }) {
        const { category, pricing = 'all', network, search, page = '1', limit = '20' } = query;

        const filter: any = {
            'marketplace.published': true,
            'marketplace.visibility': 'public',
        };

        if (category && category !== 'All') filter['marketplace.category'] = category;
        if (pricing !== 'all') filter['marketplace.pricing.type'] = pricing;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (network && network !== 'All') {
            filter['blockchain.network'] = { $regex: network, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [agents, total] = await Promise.all([
            MarketplaceRepository.listPublished(filter, skip, parseInt(limit)),
            MarketplaceRepository.countPublished(filter),
        ]);

        const result = agents.map((a: any) => ({
            ...a,
            creator: a.ownerId
                ? {
                    _id: a.ownerId._id,
                    name: a.ownerId.name || a.ownerId.username || 'Anonymous',
                    avatarUrl: a.ownerId.avatarUrl || null,
                }
                : null,
        }));

        return { agents: result, total, page: parseInt(page), limit: parseInt(limit) };
    },

    async getAgent(id: string) {
        const agent = await MarketplaceRepository.findAndIncrementViews(id);
        if (!agent) throw Object.assign(new Error('Agent not found in marketplace'), { code: 404 });

        const owner = (agent as any).ownerId as any;
        return {
            ...agent,
            creator: owner
                ? {
                    _id: owner._id,
                    name: owner.name || owner.username || 'Anonymous',
                    username: owner.username,
                    avatarUrl: owner.avatarUrl || null,
                    bio: owner.bio || null,
                    profileViews: owner.profileViews || 0,
                }
                : null,
        };
    },

    async publishListing(id: string, userId: string, data: any) {
        const { published = true, category = 'Custom', visibility = 'public', pricing, paymentMethods, networkPricing } = data;

        if (category && !(MARKETPLACE_CATEGORIES as readonly string[]).includes(category) && category !== 'Custom') {
            throw Object.assign(new Error(`Invalid category. Must be one of: ${MARKETPLACE_CATEGORIES.join(', ')}`), { code: 400 });
        }
        if (pricing?.type === 'paid' && (!pricing.price || pricing.price <= 0)) {
            throw Object.assign(new Error('Paid agents require a price greater than 0'), { code: 400 });
        }

        const agent = await MarketplaceRepository.findById(id);
        if (!agent) throw Object.assign(new Error('Agent not found'), { code: 404 });

        const workspace = await MarketplaceRepository.findOwnerWorkspace(agent.workspaceId, userId);
        if (!workspace) throw Object.assign(new Error('Not authorized'), { code: 403 });

        if (published && agent.isDraft) {
            throw Object.assign(new Error('Publish the agent before listing it on the marketplace'), { code: 400 });
        }

        const existing = (agent.marketplace as any) || {};
        const existingStats = existing.stats || {};

        agent.marketplace = {
            published,
            category,
            visibility,
            pricing: pricing || existing.pricing || { type: 'free', price: 0, currency: 'USD' },
            networkPricing: networkPricing ?? existing.networkPricing ?? [],
            paymentMethods: {
                stripe: {
                    enabled: paymentMethods?.stripe?.enabled ?? existing.paymentMethods?.stripe?.enabled ?? false,
                    stripeAccountId: existing.paymentMethods?.stripe?.stripeAccountId || '',
                },
                crypto: {
                    enabled: paymentMethods?.crypto?.enabled ?? existing.paymentMethods?.crypto?.enabled ?? false,
                    walletAddress: paymentMethods?.crypto?.walletAddress || existing.paymentMethods?.crypto?.walletAddress || '',
                    network: paymentMethods?.crypto?.network || existing.paymentMethods?.crypto?.network || '',
                    asset: paymentMethods?.crypto?.asset || existing.paymentMethods?.crypto?.asset || '',
                    amount: paymentMethods?.crypto?.amount ?? existing.paymentMethods?.crypto?.amount ?? 0,
                },
            },
            stats: {
                views: Number(existingStats.views) || 0,
                purchases: Number(existingStats.purchases) || 0,
                rating: Number(existingStats.rating) || 0,
            },
        };

        agent.markModified('marketplace');
        await agent.save();

        return { message: published ? 'Agent published to marketplace' : 'Agent removed from marketplace', agent };
    },

    async useFreeAgent(id: string, userId: string) {
        const source = await MarketplaceRepository.findMarketplaceAgent(id);
        if (!source) throw Object.assign(new Error('Agent not found in marketplace'), { code: 404 });

        const mkt = source.marketplace as any;
        if (mkt?.pricing?.type === 'paid') {
            throw Object.assign(new Error('This is a paid agent. Complete payment to obtain a copy.'), { code: 400 });
        }

        const existing = await MarketplaceRepository.findExistingPurchase(source._id, userId);
        if (existing) throw Object.assign(new Error('You already have a copy of this agent'), { code: 409, proxyAgentId: (existing as any).proxyAgentId });

        const buyerWorkspace = await MarketplaceRepository.findBuyerWorkspace(userId);
        if (!buyerWorkspace) throw Object.assign(new Error('Buyer workspace not found'), { code: 400 });

        const proxy = await MarketplaceRepository.createProxy({
            ownerId: userId,
            workspaceId: buyerWorkspace._id,
            name: `${source.name} (Copy)`,
            description: source.description,
            agentType: source.agentType,
            character: source.character,
            modelProvider: source.modelProvider,
            modelConfig: source.modelConfig,
            graph: source.graph,
            blockchain: (source.blockchain || []).map((b: any) => ({
                network: b.network,
                rpcUrl: b.rpcUrl,
                walletType: b.walletType,
            })),
            isDraft: false,
            isActive: true,
        });

        await MarketplaceRepository.createPurchase({
            agentId: source._id,
            buyerId: userId,
            sellerId: source.ownerId,
            paymentMethod: 'stripe',
            amount: 0,
            currency: 'USD',
            status: 'confirmed',
            proxyAgentId: proxy._id,
        });

        await MarketplaceRepository.incrementPurchaseCount(String(source._id));

        return { message: 'Agent copy created successfully', proxyAgent: proxy };
    },

    async initiateNetworkPurchase(id: string, userId: string, data: { network: string; txHash?: string }) {
        const { network, txHash } = data;
        const source = await MarketplaceRepository.findMarketplaceAgent(id);
        if (!source) throw Object.assign(new Error('Agent not found in marketplace'), { code: 404 });

        const mkt = source.marketplace as any;
        const netPrice = (mkt?.networkPricing || []).find((p: any) => p.network === network);
        if (!netPrice) throw Object.assign(new Error(`No pricing configured for network: ${network}`), { code: 400 });

        const purchase = await MarketplaceRepository.createPurchase({
            agentId: id, buyerId: userId, sellerId: source.ownerId,
            paymentMethod: 'crypto', amount: netPrice.price,
            currency: netPrice.asset, status: 'pending',
            cryptoTxHash: txHash, network,
        });

        return {
            purchase,
            message: txHash
                ? 'Transaction submitted — pending verification'
                : 'Purchase initiated — complete payment to confirm',
        };
    },

    async getMyPurchases(userId: string) {
        return MarketplaceRepository.findUserPurchases(userId);
    },

    async getCreatorProfile(id: string, viewerId?: string) {
        const viewerIsOwner = viewerId === String(id);
        const creator = await MarketplaceRepository.incrementCreatorProfileViews(id, !viewerIsOwner);
        if (!creator) throw Object.assign(new Error('Creator not found'), { code: 404 });

        const agents = await MarketplaceRepository.findCreatorAgents(id);

        const totalViews = agents.reduce((s: number, a: any) => s + (Number(a.marketplace?.stats?.views) || 0), 0);
        const totalPurchases = agents.reduce((s: number, a: any) => s + (Number(a.marketplace?.stats?.purchases) || 0), 0);
        const ratings = agents.map((a: any) => Number(a.marketplace?.stats?.rating) || 0).filter(r => r > 0);
        const avgRating = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : 0;

        return {
            creator: { _id: creator._id, name: (creator as any).name || creator.username || 'Anonymous', username: creator.username, avatarUrl: (creator as any).avatarUrl || null, bio: (creator as any).bio || null, profileViews: (creator as any).profileViews, memberSince: (creator as any).createdAt },
            stats: { totalAgents: agents.length, totalViews, totalPurchases, avgRating },
            agents,
        };
    },

    async getMyStats(userId: string) {
        const record = await MarketplaceRepository.findUserForStats(userId);
        if (!record) throw Object.assign(new Error('User not found'), { code: 404 });

        const { agents, purchases, reviews } = await MarketplaceRepository.findCreatorStats(userId);

        const publishedAgents = agents.filter(a => !a.isDraft);
        const listedAgents = agents.filter(a => (a.marketplace as any)?.published);
        const totalViews = agents.reduce((s: number, a: any) => s + (Number(a.marketplace?.stats?.views) || 0), 0);
        const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const avgRating = reviews.length ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

        return { profileViews: (record as any).profileViews, totalAgents: agents.length, publishedAgents: publishedAgents.length, listedAgents: listedAgents.length, totalViews, totalRevenue, totalPurchases: purchases.length, totalReviews: reviews.length, avgRating };
    },

    async updateMyProfile(userId: string, body: any) {
        const { bio, avatarUrl, name } = body;
        const update: Record<string, string> = {};
        if (bio !== undefined) update.bio = bio.slice(0, 500);
        if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
        if (name !== undefined) update.name = name;
        return MarketplaceRepository.updateCreatorProfile(userId, update);
    },
};
