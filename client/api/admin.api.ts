import { apiFetch } from '@/lib/api-client';

export const adminApi = {
    deleteUser: async (id: string) => {
        return apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    },
    toggleAdminStatus: async (id: string, isAdmin: boolean) => {
        return apiFetch(`/admin/users/${id}/admin`, {
            method: 'PATCH',
            body: JSON.stringify({ isAdmin }),
        });
    },
    updateSupportTicket: async (id: string, payload: any) => {
        return apiFetch(`/admin/support-tickets/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },
    deleteBlogPost: async (id: string) => {
        return apiFetch(`/admin/blog/${id}`, { method: 'DELETE' });
    },
    toggleCmsFreeze: async (payload: any) => {
        return apiFetch('/admin/blog/freeze', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
