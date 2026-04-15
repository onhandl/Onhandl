import mongoose from 'mongoose';
import { AgentRepository } from '../agent.repository';
import { Purchase } from '../../../infrastructure/database/models/Purchase';
import { Workspace } from '../../../infrastructure/database/models/Workspace';
import { build30DayChart } from '../../../shared/utils/chart-utils';
import { getUserPlan, assertRevenueDashboard, assertAdvancedAnalytics } from '../../../shared/utils/plan-enforcement';

export const AgentAnalyticsService = {
    async getRevenueDashboard(userId: string) {
        // ── Plan enforcement: revenue dashboard (Pro+) ────────────────────────
        const planId = await getUserPlan(userId);
        assertRevenueDashboard(planId);

        const sellerOid = new mongoose.Types.ObjectId(userId);
        const workspace = await Workspace.findOne({ ownerId: sellerOid });
        if (!workspace) return { agents: [], totalViews: 0, totalPurchases: 0, totalRevenue: 0, chartData: [] };

        const [agents, purchases] = await Promise.all([
            AgentRepository.findWithSelect({ workspaceId: workspace._id }, 'name description marketplace agentType isDraft createdAt ownerId'),
            Purchase.find({ sellerId: sellerOid }).sort({ createdAt: -1 }),
        ]);

        const totalViews = agents.reduce((s: number, a: any) => s + (Number((a.marketplace as any)?.stats?.views) || 0), 0);
        const totalPurchases = purchases.length;
        const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const chartData = build30DayChart(purchases);

        const agentBreakdown = agents.map((a: any) => {
            const mkt = (a.marketplace as any) || {};
            const ap = purchases.filter((p: any) => String(p.agentId) === String(a._id));
            return {
                _id: a._id, name: a.name, description: a.description, agentType: a.agentType,
                isDraft: a.isDraft, published: mkt.published || false, category: mkt.category,
                views: Number(mkt.stats?.views) || 0, purchases: ap.length,
                revenue: ap.reduce((s: number, p: any) => s + (p.amount || 0), 0),
                pricing: mkt.pricing,
            };
        });

        return { agents: agentBreakdown, totalViews, totalPurchases, totalRevenue, chartData };
    },

    async getAgentStats(agentId: string, userId?: string) {
        // ── Plan enforcement: advanced analytics (Pro+) ───────────────────────
        if (userId) {
            const planId = await getUserPlan(userId);
            assertAdvancedAnalytics(planId);
        }

        const agent = await AgentRepository.findById(agentId);
        if (!agent) throw { code: 404, message: 'Agent not found' };

        const purchases = await Purchase.find({ agentId }).sort({ createdAt: -1 });
        const mkt = (agent.marketplace as any) || {};

        return {
            views: Number(mkt.stats?.views) || 0,
            purchases: purchases.length,
            revenue: purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0),
            rating: Number(mkt.stats?.rating) || 0,
            chartData: build30DayChart(purchases),
        };
    }
};
