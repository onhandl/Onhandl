import { apiFetch } from './api-client';

export const aiApi = {
    testConnection: async (provider: string, apiKey: string) => {
        return apiFetch('/ai/test-connection', {
            method: 'POST',
            body: JSON.stringify({ provider, apiKey }),
        });
    },
};
