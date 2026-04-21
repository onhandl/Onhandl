import mongoose from 'mongoose';
import { Review } from '../../infrastructure/database/models/Review';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';

export const ReviewRepository = {
    async findOne(filter: Record<string, unknown>) {
        return Review.findOne(filter);
    },
    async findOneLean(filter: Record<string, unknown>) {
        return Review.findOne(filter).lean();
    },
    async create(data: Record<string, unknown>) {
        return Review.create(data);
    },
    async findForAgent(agentId: string, skip: number, limit: number) {
        return Review.find({ agentId })
            .populate('reviewerId', 'username name avatarUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    },
    async countForAgent(agentId: string) {
        return Review.countDocuments({ agentId });
    },
    async getAvgRating(agentId: string) {
        const result = await Review.aggregate([
            { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        return { avg: result[0]?.avg ?? 0, count: result[0]?.count ?? 0 };
    },
    async updateAgentStats(agentId: string, rating: number, count: number) {
        return AgentDefinition.updateOne(
            { _id: agentId },
            { $set: { 'marketplace.stats.rating': Math.round(rating * 10) / 10, 'marketplace.stats.reviews': count } }
        );
    },
};
