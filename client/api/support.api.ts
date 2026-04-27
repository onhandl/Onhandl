import { apiFetch } from '@/lib/api-client';

export const supportApi = {
    getTickets: async () => apiFetch('/support/support'),
    createTicket: async (data: { subject: string; message: string }) => {
        return apiFetch('/support/tickets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
