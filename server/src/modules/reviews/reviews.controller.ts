import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { Review } from '../../infrastructure/database/models/Review';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { verifyAuthCookie } from '../../api/middlewares/auth';

export const reviewsController: FastifyPluginAsync = async (fastify) => {

    fastify.post<{ Params: { id: string }; Body: { rating: number; comment?: string } }>(
        '/agents/:id/reviews',
        async (request, reply) => {
            const decoded = verifyAuthCookie(fastify, request.cookies, reply);
            if (!decoded) return;
            const { rating, comment = '' } = request.body;
            if (!rating || rating < 1 || rating > 5) return reply.code(400).send({ error: 'Rating must be between 1 and 5' });
            const agentId = request.params.id;
            const reviewerId = new mongoose.Types.ObjectId(decoded.id);
            const purchase = await Purchase.findOne({ agentId, buyerId: reviewerId, status: 'confirmed' });
            if (!purchase) return reply.code(403).send({ error: 'Only verified buyers can leave a review' });
            const existing = await Review.findOne({ agentId, reviewerId });
            if (existing) { existing.rating = rating; existing.comment = comment; await existing.save(); }
            else { await Review.create({ agentId, reviewerId, rating, comment }); }
            const agg = await Review.aggregate([{ $match: { agentId: new mongoose.Types.ObjectId(agentId) } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
            const avg = agg[0]?.avg ?? rating;
            const count = agg[0]?.count ?? 1;
            await AgentDefinition.updateOne({ _id: agentId }, { $set: { 'marketplace.stats.rating': Math.round(avg * 10) / 10, 'marketplace.stats.reviews': count } });
            return { message: 'Review saved', rating, comment };
        }
    );

    fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
        '/agents/:id/reviews',
        async (request) => {
            const { page = '1', limit = '10' } = request.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const agentId = request.params.id;
            const [reviews, total] = await Promise.all([
                Review.find({ agentId }).populate('reviewerId', 'username name avatarUrl').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
                Review.countDocuments({ agentId }),
            ]);
            const avg = total > 0 ? (await Review.aggregate([{ $match: { agentId: new mongoose.Types.ObjectId(agentId) } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]))[0]?.avg ?? 0 : 0;
            return {
                reviews: reviews.map((r: any) => ({ _id: r._id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, reviewer: { _id: (r.reviewerId as any)?._id, name: (r.reviewerId as any)?.name || (r.reviewerId as any)?.username || 'Anonymous', avatarUrl: (r.reviewerId as any)?.avatarUrl || null } })),
                total, avgRating: Math.round(avg * 10) / 10, page: parseInt(page),
            };
        }
    );

    fastify.get<{ Params: { id: string } }>('/agents/:id/reviews/mine', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;
        const review = await Review.findOne({ agentId: request.params.id, reviewerId: new mongoose.Types.ObjectId(decoded.id) }).lean();
        const purchase = await Purchase.findOne({ agentId: request.params.id, buyerId: new mongoose.Types.ObjectId(decoded.id), status: 'confirmed' }).lean();
        return { canReview: !!purchase, hasReviewed: !!review, existingReview: review ? { rating: (review as any).rating, comment: (review as any).comment } : null };
    });
};
