import mongoose from 'mongoose';
import { ReviewRepository } from './reviews.repository';

export const ReviewService = {
    async submitReview(userId: string, agentId: string, rating: number, comment = '') {
        if (!rating || rating < 1 || rating > 5) {
            throw Object.assign(new Error('Rating must be between 1 and 5'), { code: 400 });
        }
        const reviewerId = new mongoose.Types.ObjectId(userId);

        // Verified buyer check removed as part of payment system refactor
        const existing = await ReviewRepository.findOne({ agentId, reviewerId });
        if (existing) {
            existing.rating = rating;
            (existing as any).comment = comment;
            await existing.save();
        } else {
            await ReviewRepository.create({ agentId, reviewerId, rating, comment });
        }

        const { avg, count } = await ReviewRepository.getAvgRating(agentId);
        await ReviewRepository.updateAgentStats(agentId, avg === 0 ? rating : avg, count === 0 ? 1 : count);
        return { message: 'Review saved', rating, comment };
    },

    async listReviews(agentId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            ReviewRepository.findForAgent(agentId, skip, limit),
            ReviewRepository.countForAgent(agentId),
        ]);
        const { avg } = total > 0 ? await ReviewRepository.getAvgRating(agentId) : { avg: 0 };
        return {
            reviews: reviews.map((r: any) => ({
                _id: r._id, rating: r.rating, comment: r.comment, createdAt: r.createdAt,
                reviewer: { _id: r.reviewerId?._id, name: r.reviewerId?.name || r.reviewerId?.username || 'Anonymous', avatarUrl: r.reviewerId?.avatarUrl || null },
            })),
            total, avgRating: Math.round(avg * 10) / 10, page,
        };
    },

    async getMyReview(userId: string, agentId: string) {
        const reviewerId = new mongoose.Types.ObjectId(userId);
        const review = await ReviewRepository.findOneLean({ agentId, reviewerId });
        return {
            canReview: true, // Everyone can review for now as per refactor
            hasReviewed: !!review,
            existingReview: review ? { rating: (review as any).rating, comment: (review as any).comment } : null,
        };
    },
};
