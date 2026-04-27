import { apiFetch } from '@/lib/api-client';

export const terminalApi = {
    approve: async (payload: any) => {
        return apiFetch('/terminal/auth/approve', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
