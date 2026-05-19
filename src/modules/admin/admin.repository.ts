
import { BlogPost } from '../../infrastructure/database/models/BlogPost';
import { AdminSettings } from '../../infrastructure/database/models/AdminSettings';
import { SupportTicket } from '../../infrastructure/database/models/SupportTicket';
import { User } from '../../infrastructure/database/models/User';
import { FinancialAgent } from '../../infrastructure/database/models/FinancialAgent';

export const AdminRepository = {
    // ── Agents ───────────────────────────────────────────────────────────────
    async findAgents(filter: Record<string, unknown>) {
        return FinancialAgent.find(filter).sort({ createdAt: -1 }).lean();
    },



    // ── Blog ──────────────────────────────────────────────────────────────────
    async findBlogPosts() {
        return BlogPost.find().sort({ createdAt: -1 }).lean();
    },

    async deleteBlogPost(id: string) {
        return BlogPost.findByIdAndDelete(id);
    },

    async updateAdminSettings(update: Record<string, unknown>) {
        return AdminSettings.findOneAndUpdate({}, update, { upsert: true, new: true });
    },

    // ── Support ───────────────────────────────────────────────────────────────
    async findSupportTickets() {
        return SupportTicket.find().sort({ createdAt: -1 }).lean();
    },

    async updateSupportTicket(id: string, update: Record<string, unknown>) {
        return SupportTicket.findByIdAndUpdate(id, update, { new: true });
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    async findUsers() {
        return User.find().select('-password').sort({ createdAt: -1 }).lean();
    },

    async deleteUser(id: string) {
        return User.findByIdAndDelete(id);
    },

    async updateUserAdmin(id: string, isAdmin: boolean) {
        return User.findByIdAndUpdate(id, { isAdmin }, { new: true }).select('-password');
    },
};
