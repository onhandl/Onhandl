import { apiFetch } from './api-client';

export const toolsApi = {
    getBlockchainTools: async () => {
        return await apiFetch('/api/tools');
    }
};
