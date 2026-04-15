import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { User } from '../../infrastructure/database/models/User';
import { Review } from '../../infrastructure/database/models/Review';
import mongoose from 'mongoose';

export const MarketplaceRepository = {
    async listPublished(filter: Record<string, unknown>, skip: number, limit: number) {
        return AgentDefinition.find(filter)
            .select('name description agentType marketplace blockchain ownerId createdAt updatedAt')
            .populate('ownerId', 'username name avatarUrl')
            .sort({ 'marketplace.stats.views': -1, updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    },
    async countPublished(filter: Record<string, unknown>) {
        return AgentDefinition.countDocuments(filter);
    },
    async findAndIncrementViews(id: string) {
        return AgentDefinition.findOneAndUpdate(
            { _id: id, 'marketplace.published': true },
            { $inc: { 'marketplace.stats.views': 1 } },
            { new: true }
        )
            .select('-blockchain.privateKey -blockchain.publicKey')
            .populate('ownerId', 'username name avatarUrl bio profileViews')
            .lean();
    },
    async findMarketplaceAgent(id: string) {
        return AgentDefinition.findOne({ _id: id, 'marketplace.published': true });
    },
    async findById(id: string) {
        return AgentDefinition.findById(id);
    },
    async createProxy(data: Record<string, unknown>) {
        return AgentDefinition.create(data);
    },
    async incrementPurchaseCount(id: string) {
        return AgentDefinition.updateOne({ _id: id }, { $inc: { 'marketplace.stats.purchases': 1 } });
    },
    async findOwnerWorkspace(agentWorkspaceId: unknown, ownerId: string) {
        return Workspace.findOne({ _id: agentWorkspaceId, ownerId });
    },
    async findBuyerWorkspace(ownerId: string) {
        return Workspace.findOne({ ownerId });
    },
    async findExistingPurchase(agentId: unknown, buyerId: string) {
        return Purchase.findOne({ agentId, buyerId, status: 'confirmed' });
    },
    async createPurchase(data: Record<string, unknown>) {
        return Purchase.create(data);
    },
    async findPurchaseByStripeSession(sessionId: string) {
        return Purchase.findOneAndUpdate({ stripeSessionId: sessionId }, { status: 'confirmed' });
    },
    async findUserPurchases(buyerId: string) {
        return Purchase.find({ buyerId })
            .populate('agentId', 'name description marketplace')
            .sort({ createdAt: -1 });
    },
    async incrementCreatorProfileViews(creatorId: string, shouldIncrement: boolean) {
        return User.findByIdAndUpdate(
            creatorId,
            shouldIncrement ? { $inc: { profileViews: 1 } } : {},
            { new: true }
        ).select('username name avatarUrl bio profileViews createdAt');
    },
    async findCreatorAgents(creatorId: string) {
        return AgentDefinition.find({
            ownerId: new mongoose.Types.ObjectId(creatorId),
            'marketplace.published': true,
        })
            .select('name description agentType marketplace createdAt updatedAt')
            .sort({ 'marketplace.stats.views': -1 })
            .lean();
    },
    async findCreatorStats(creatorId: string) {
        const [agents, purchases, reviews] = await Promise.all([
            AgentDefinition.find({ ownerId: creatorId }).select('name marketplace isDraft'),
            Purchase.find({ sellerId: new mongoose.Types.ObjectId(creatorId) }),
            Review.find({
                agentId: {
                    $in: (await AgentDefinition.find({ ownerId: creatorId }).select('_id')).map((a) => a._id),
                },
            }).select('rating'),
        ]);
        return { agents, purchases, reviews };
    },
    async updateCreatorProfile(creatorId: string, update: Record<string, any>) {
        return User.findByIdAndUpdate(creatorId, update, { new: true }).select(
            'username name avatarUrl bio profileViews'
        );
    },
    async findUserForStats(userId: string) {
        return User.findById(userId).select('username name avatarUrl bio profileViews createdAt');
    },
};
