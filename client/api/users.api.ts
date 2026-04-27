import { apiFetch } from '@/lib/api-client';

export const usersApi = {
    getApiKeys: async () => {
        return apiFetch('/users/api-keys');
    },
    updateApiKeys: async (payload: any) => {
        return apiFetch('/users/api-keys', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
};
