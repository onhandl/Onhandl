import { FastifyPluginAsync } from 'fastify';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { verifyAuthCookie } from '../../api/middlewares/auth';

const MARKETPLACE_CATEGORIES = [
    'Trading Bot',
    'Analytics',
    'DeFi Assistant',
    'Portfolio Manager',
    'Data Feed',
    'Custom',
] as const;

const MARKETPLACE_NETWORKS = ['Ethereum', 'CKB', 'Solana', 'Polygon', 'All'] as const;

export const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
    // ── List published agents ─────────────────────────────────────────────────
    fastify.get<{
        Querystring: {
            category?: string;
            pricing?: 'free' | 'paid' | 'all';
            network?: string;
            search?: string;
            page?: string;
            limit?: string;
        };
    }>('/marketplace', async (request) => {
        const { category, pricing = 'all', network, search, page = '1', limit = '20' } = request.query;

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
            AgentDefinition.find(filter)
                .select('name description agentType marketplace blockchain ownerId createdAt updatedAt')
                .populate('ownerId', 'username name avatarUrl')
                .sort({ 'marketplace.stats.views': -1, updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            AgentDefinition.countDocuments(filter),
        ]);

        // Normalise creator field for frontend consumption
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
    });

    // ── Get single marketplace agent ──────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/marketplace/:id', async (request, reply) => {
        const { id } = request.params;
        const agent = await AgentDefinition.findOneAndUpdate(
            { _id: id, 'marketplace.published': true },
            { $inc: { 'marketplace.stats.views': 1 } },
            { new: true }
        )
            .select('-blockchain.privateKey -blockchain.publicKey')
            .populate('ownerId', 'username name avatarUrl bio profileViews')
            .lean();

        if (!agent) return reply.code(404).send({ error: 'Agent not found in marketplace' });

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
    });

    // ── Publish / update marketplace listing ──────────────────────────────────
    fastify.post<{
        Params: { id: string };
        Body: {
            published?: boolean;
            category?: string;
            visibility?: 'public' | 'unlisted';
            pricing?: { type: 'free' | 'paid'; price?: number; currency?: string };
            paymentMethods?: {
                stripe?: { enabled: boolean };
                crypto?: {
                    enabled: boolean;
                    walletAddress?: string;
                    network?: string;
                    asset?: string;
                    amount?: number;
                };
            };
        };
    }>('/marketplace/:id/publish', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { id } = request.params;
        const { published = true, category = 'Custom', visibility = 'public', pricing, paymentMethods, networkPricing } = request.body as any;

        // Input validation
        if (category && !(MARKETPLACE_CATEGORIES as readonly string[]).includes(category) && category !== 'Custom') {
            return reply.code(400).send({ error: `Invalid category. Must be one of: ${MARKETPLACE_CATEGORIES.join(', ')}` });
        }
        if (pricing?.type === 'paid' && (!pricing.price || pricing.price <= 0)) {
            return reply.code(400).send({ error: 'Paid agents require a price greater than 0' });
        }

        const agent = await AgentDefinition.findById(id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        // Verify ownership
        const workspace = await Workspace.findOne({ _id: agent.workspaceId, ownerId: decoded.id });
        if (!workspace) return reply.code(403).send({ error: 'Not authorized' });

        // Agents must be published (not draft) before listing on marketplace
        if (published && agent.isDraft) {
            return reply.code(400).send({ error: 'Publish the agent before listing it on the marketplace' });
        }

        const existing = (agent.marketplace as any) || {};
        const existingStats = existing.stats || {};

        agent.marketplace = {
            published,
            category,
            visibility,
            pricing: pricing || existing.pricing || { type: 'free', price: 0, currency: 'USD' },
            // networkPricing: per-network pricing for multi-chain marketplace
            // e.g. [{ network: 'CKB', asset: 'CKB', price: '5000000000', decimals: 8 }]
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

        try {
            await agent.save();
        } catch (err: any) {
            console.error('[Marketplace Publish] Save error:', err);
            return reply.code(500).send({ error: 'Failed to save marketplace listing', details: err.message });
        }

        return { message: published ? 'Agent published to marketplace' : 'Agent removed from marketplace', agent };
    });

    // ── Use a free marketplace agent → creates a proxy agent for the buyer ───
    fastify.post<{ Params: { id: string } }>('/marketplace/:id/use', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const source = await AgentDefinition.findOne({
            _id: request.params.id,
            'marketplace.published': true,
        });
        if (!source) return reply.code(404).send({ error: 'Agent not found in marketplace' });

        const mkt = source.marketplace as any;
        if (mkt?.pricing?.type === 'paid') {
            return reply.code(400).send({ error: 'This is a paid agent. Complete payment to obtain a copy.' });
        }

        // Prevent duplicate proxies
        const existing = await Purchase.findOne({ agentId: source._id, buyerId: decoded.id, status: 'confirmed' });
        if (existing) return reply.code(409).send({ error: 'You already have a copy of this agent', proxyAgentId: (existing as any).proxyAgentId });

        const buyerWorkspace = await Workspace.findOne({ ownerId: decoded.id });
        if (!buyerWorkspace) return reply.code(400).send({ error: 'Buyer workspace not found' });

        const proxy = await AgentDefinition.create({
            ownerId: decoded.id,
            workspaceId: buyerWorkspace._id,
            name: `${source.name} (Copy)`,
            description: source.description,
            agentType: source.agentType,
            character: source.character,
            modelProvider: source.modelProvider,
            modelConfig: source.modelConfig,
            graph: source.graph,
            // Strip all private keys — buyer gets fresh empty blockchain slots
            blockchain: (source.blockchain || []).map((b: any) => ({
                network: b.network,
                rpcUrl: b.rpcUrl,
                walletType: b.walletType,
            })),
            isDraft: false,
            isActive: true,
        });

        await Purchase.create({
            agentId: source._id,
            buyerId: decoded.id,
            sellerId: source.ownerId,
            paymentMethod: 'stripe',
            amount: 0,
            currency: 'USD',
            status: 'confirmed',
            proxyAgentId: proxy._id,
        });

        // Increment purchase counter on source
        await AgentDefinition.updateOne({ _id: source._id }, { $inc: { 'marketplace.stats.purchases': 1 } });

        return { message: 'Agent copy created successfully', proxyAgent: proxy };
    });

    // ── Fiber / multi-chain purchase ──────────────────────────────────────────
    // Buyer selects a network, pays via Fiber invoice (CKB) or submits txHash (other chains)
    fastify.post<{ Params: { id: string }; Body: { network: string; fromAgentId?: string; txHash?: string } }>(
        '/marketplace/:id/network-purchase',
        async (request, reply) => {
            const decoded = verifyAuthCookie(fastify, request.cookies, reply);
            if (!decoded) return;

            const { id } = request.params;
            const { network, fromAgentId, txHash } = request.body;

            const source = await AgentDefinition.findOne({ _id: id, 'marketplace.published': true });
            if (!source) return reply.code(404).send({ error: 'Agent not found in marketplace' });

            const mkt = source.marketplace as any;
            const netPrice = (mkt?.networkPricing || []).find((p: any) => p.network === network);
            if (!netPrice) return reply.code(400).send({ error: `No pricing configured for network: ${network}` });

            // Create pending purchase record
            const purchase = await Purchase.create({
                agentId: id, buyerId: decoded.id, sellerId: source.ownerId,
                paymentMethod: 'crypto', amount: netPrice.price,
                currency: netPrice.asset, status: 'pending',
                cryptoTxHash: txHash, network,
            });

            return reply.code(201).send({
                purchase,
                message: txHash
                    ? 'Transaction submitted — pending verification'
                    : 'Purchase initiated — complete payment to confirm',
            });
        }
    );

    // ── Purchase history for buyer ────────────────────────────────────────────
    fastify.get('/marketplace/purchases/mine', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const purchases = await Purchase.find({ buyerId: decoded.id })
            .populate('agentId', 'name description marketplace')
            .sort({ createdAt: -1 });

        return purchases;
    });
};
