import { AdminRepository } from './admin.repository';

export const AdminService = {
    // ── Agents ───────────────────────────────────────────────────────────────
    async listPublishedAgents() {
        return AdminRepository.findAgents({ isDraft: false });
    },

    async listDraftAgents() {
        return AdminRepository.findAgents({ isDraft: true });
    },


    // ── Blog ──────────────────────────────────────────────────────────────────
    async listBlogPosts() {
        return AdminRepository.findBlogPosts();
    },

    async deleteBlogPost(id: string) {
        const result = await AdminRepository.deleteBlogPost(id);
        if (!result) throw Object.assign(new Error('Post not found'), { code: 404 });
        return { success: true };
    },

    async freezeCms(frozen: boolean, reason?: string) {
        const settings = await AdminRepository.updateAdminSettings({
            cmsFrozen: frozen,
            cmsFrozenReason: reason ?? '',
        });
        return { cmsFrozen: (settings as any).cmsFrozen, reason: (settings as any).cmsFrozenReason };
    },

    // ── Support ───────────────────────────────────────────────────────────────
    async listSupportTickets() {
        return AdminRepository.findSupportTickets();
    },

    async updateSupportTicket(id: string, status?: string, adminNotes?: string) {
        const update: Record<string, unknown> = {};
        if (status) update.status = status;
        if (adminNotes !== undefined) update.adminNotes = adminNotes;

        const ticket = await AdminRepository.updateSupportTicket(id, update);
        if (!ticket) throw Object.assign(new Error('Ticket not found'), { code: 404 });
        return ticket;
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    async listUsers() {
        return AdminRepository.findUsers();
    },

    async deleteUser(id: string) {
        const result = await AdminRepository.deleteUser(id);
        if (!result) throw Object.assign(new Error('User not found'), { code: 404 });
        return { success: true };
    },

    async toggleUserAdmin(id: string, isAdmin: boolean) {
        const user = await AdminRepository.updateUserAdmin(id, isAdmin);
        if (!user) throw Object.assign(new Error('User not found'), { code: 404 });
        return user;
    },
};
