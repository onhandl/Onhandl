import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { User } from '../../infrastructure/database/models/User';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { Review } from '../../infrastructure/database/models/Review';
import { verifyAuthCookie } from '../../api/middlewares/auth';

export const creatorsController: FastifyPluginAsync = async (fastify) => {

    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const { id } = request.params;
        let viewerIsOwner = false;
        const token = request.cookies['auth_token'];
        if (token) {
            try { const decoded = fastify.jwt.verify<{ id: string }>(token); viewerIsOwner = decoded.id === id; } catch { /* visitor */ }
        }
        const creator = await User.findByIdAndUpdate(id, viewerIsOwner ? {} : { $inc: { profileViews: 1 } }, { new: true }).select('username name avatarUrl bio profileViews createdAt');
        if (!creator) return reply.code(404).send({ error: 'Creator not found' });
        const agents = await AgentDefinition.find({ ownerId: new mongoose.Types.ObjectId(id), 'marketplace.published': true }).select('name description agentType marketplace createdAt updatedAt').sort({ 'marketplace.stats.views': -1 }).lean();
        const totalViews = agents.reduce((s: number, a: any) => s + (Number((a.marketplace as any)?.stats?.views) || 0), 0);
        const totalPurchases = agents.reduce((s: number, a: any) => s + (Number((a.marketplace as any)?.stats?.purchases) || 0), 0);
        const ratings = agents.map((a: any) => Number((a.marketplace as any)?.stats?.rating) || 0).filter((r: any) => r > 0);
        const avgRating = ratings.length ? Math.round((ratings.reduce((s: number, r: any) => s + r, 0) / ratings.length) * 10) / 10 : 0;
        return { creator: { _id: creator._id, name: creator.name || creator.username || 'Anonymous', username: creator.username, avatarUrl: (creator as any).avatarUrl || null, bio: (creator as any).bio || null, profileViews: (creator as any).profileViews, memberSince: creator.createdAt }, stats: { totalAgents: agents.length, totalViews, totalPurchases, avgRating }, agents };
    });

    fastify.get('/me/stats', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;
        const user = await User.findById(decoded.id).select('username name avatarUrl bio profileViews createdAt');
        if (!user) return reply.code(404).send({ error: 'User not found' });
        const [agents, purchases, reviews] = await Promise.all([
            AgentDefinition.find({ ownerId: decoded.id }).select('name marketplace isDraft'),
            Purchase.find({ sellerId: new mongoose.Types.ObjectId(decoded.id) }),
            Review.find({ agentId: { $in: (await AgentDefinition.find({ ownerId: decoded.id }).select('_id')).map(a => a._id) } }).select('rating'),
        ]);
        const publishedAgents = agents.filter(a => !a.isDraft);
        const listedAgents = agents.filter(a => (a.marketplace as any)?.published);
        const totalViews = agents.reduce((s: number, a: any) => s + (Number((a.marketplace as any)?.stats?.views) || 0), 0);
        const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const avgRating = reviews.length ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
        return { profileViews: (user as any).profileViews, totalAgents: agents.length, publishedAgents: publishedAgents.length, listedAgents: listedAgents.length, totalViews, totalRevenue, totalPurchases: purchases.length, totalReviews: reviews.length, avgRating };
    });

    fastify.put<{ Body: { bio?: string; avatarUrl?: string; name?: string } }>(
        '/me',
        async (request, reply) => {
            const decoded = verifyAuthCookie(fastify, request.cookies, reply);
            if (!decoded) return;
            const { bio, avatarUrl, name } = request.body;
            const update: Record<string, string> = {};
            if (bio !== undefined) update.bio = bio.slice(0, 500);
            if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
            if (name !== undefined) update.name = name;
            return User.findByIdAndUpdate(decoded.id, update, { new: true }).select('username name avatarUrl bio profileViews');
        }
    );
};
