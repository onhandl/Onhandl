import { apiFetch } from './api-client';

export const agentApi = {
    loadAgents: async () => {
        return apiFetch('/agents');
    },

    enhancePersona: async (name: string, persona: string, provider?: string, apiKey?: string) => {
        return apiFetch('/agents/enhance', {
            method: 'POST',
            body: JSON.stringify({ name, persona, provider, apiKey }),
        });
    },

    saveAgent: async (name: string, graph?: { nodes: any[]; edges: any[] }, persona?: string, description?: string, isDraft: boolean = true, provider?: string, apiKey?: string) => {
        return apiFetch('/agents', {
            method: 'POST',
            body: JSON.stringify({
                name,
                persona,
                description,
                graph,
                isDraft,
                provider,
                apiKey
            }),
        });
    },

    updateAgent: async (id: string, updates: { name?: string; description?: string; persona?: string; graph?: { nodes: any[]; edges: any[] }; identities?: any; isDraft?: boolean; provider?: string; apiKey?: string }) => {
        return apiFetch(`/agents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },
    // ...

    getAgent: async (id: string) => {
        return apiFetch(`/agents/${id}`);
    },

    deleteAgent: async (id: string) => {
        return apiFetch(`/agents/${id}`, {
            method: 'DELETE',
        });
    },
};
