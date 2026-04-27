import { apiFetch } from '@/lib/api-client';

export const workspaceApi = {
    getWorkspaces: async () => {
        return apiFetch('/workspaces/workspaces');
    },
    createWorkspace: async (payload: any) => {
        return apiFetch('/workspaces/workspaces', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
