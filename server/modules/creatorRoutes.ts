import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { User }            from '../models/User';
import { AgentDefinition } from '../models/AgentDefinition';
import { Purchase }        from '../models/Purchase';
import { Review }          from '../models/Review';

export const creatorRoutes: FastifyPluginAsync = async (fastify) => {

    // ── Public creator profile (increments profileViews) ─────────────────────
    fastify.get<{ Params: { id: string } }>('/creators/:id', async (request, reply) => {
        const { id } = request.params;

        // Determine if the requester is viewing their own profile (no view count bump)
        let viewerIsOwner = false;
        const token = (request.cookies as any)['auth_token'];
        if (token) {
            try {
                const decoded: any = fastify.jwt.verify(token);
                viewerIsOwner = decoded.id === id;
            } catch { /* ignore */ }
        }

        const creator = await User.findByIdAndUpdate(
            id,
            viewerIsOwner ? {} : { $inc: { profileViews: 1 } },
            { new: true }
        ).select('username name avatarUrl bio profileViews createdAt');

        if (!creator) return reply.code(404).send({ error: 'Creator not found' });

        // All marketplace-published agents by this creator
        const agents = await AgentDefinition.find({
            ownerId: new mongoose.Types.ObjectId(id),
            'marketplace.published': true,
        })
            .select('name description agentType marketplace createdAt updatedAt')
            .sort({ 'marketplace.stats.views': -1 })
            .lean();

        // Aggregate total stats across all published agents
        const totalViews     = agents.reduce((s, a) => s + (Number((a.marketplace as any)?.stats?.views)     || 0), 0);
        const totalPurchases = agents.reduce((s, a) => s + (Number((a.marketplace as any)?.stats?.purchases) || 0), 0);
        const ratings        = agents.map(a => Number((a.marketplace as any)?.stats?.rating) || 0).filter(r => r > 0);
        const avgRating      = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : 0;

        return {
            creator: {
                _id:          creator._id,
                name:         creator.name || creator.username || 'Anonymous',
                username:     creator.username,
                avatarUrl:    (creator as any).avatarUrl || null,
                bio:          (creator as any).bio       || null,
                profileViews: (creator as any).profileViews,
                memberSince:  creator.createdAt,
            },
            stats: { totalAgents: agents.length, totalViews, totalPurchases, avgRating },
            agents,
        };
    });

    // ── Own profile stats (authenticated — no view bump) ─────────────────────
    fastify.get('/creators/me/stats', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        let decoded: any;
        try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

        const user = await User.findById(decoded.id).select('username name avatarUrl bio profileViews createdAt');
        if (!user) return reply.code(404).send({ error: 'User not found' });

        const [agents, purchases, reviews] = await Promise.all([
            AgentDefinition.find({ ownerId: decoded.id }).select('name marketplace isDraft'),
            Purchase.find({ sellerId: new mongoose.Types.ObjectId(decoded.id) }),
            Review.find({ agentId: { $in: (await AgentDefinition.find({ ownerId: decoded.id }).select('_id')).map(a => a._id) } })
                  .select('rating'),
        ]);

        const publishedAgents = agents.filter(a => !a.isDraft);
        const listedAgents    = agents.filter(a => (a.marketplace as any)?.published);
        const totalViews      = agents.reduce((s, a) => s + (Number((a.marketplace as any)?.stats?.views) || 0), 0);
        const totalRevenue    = purchases.reduce((s, p) => s + (p.amount || 0), 0);
        const avgRating       = reviews.length
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
            : 0;

        return {
            profileViews:   (user as any).profileViews,
            totalAgents:    agents.length,
            publishedAgents: publishedAgents.length,
            listedAgents:   listedAgents.length,
            totalViews,
            totalRevenue,
            totalPurchases: purchases.length,
            totalReviews:   reviews.length,
            avgRating,
        };
    });

    // ── Update creator profile (bio, avatarUrl) ───────────────────────────────
    fastify.put<{ Body: { bio?: string; avatarUrl?: string; name?: string } }>(
        '/creators/me', async (request, reply) => {
            const token = (request.cookies as any)['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });
            let decoded: any;
            try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

            const { bio, avatarUrl, name } = request.body;
            const update: any = {};
            if (bio       !== undefined) update.bio       = bio.slice(0, 500);
            if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
            if (name      !== undefined) update.name      = name;

            const user = await User.findByIdAndUpdate(decoded.id, update, { new: true })
                .select('username name avatarUrl bio profileViews');

            return user;
        }
    );
};
