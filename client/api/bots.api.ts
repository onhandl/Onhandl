import { apiFetch } from '@/lib/api-client';

export const botsApi = {
    chat: async (payload: any) => {
        return apiFetch('/bots/chat', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
