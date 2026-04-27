import { apiFetch } from '@/lib/api-client';

export type FinancialAgentPreset = 'conservative_treasury' | 'balanced_allocator' | 'aggressive_growth';

export const financialAgentApi = {
    createDraft: async (data: any) => {
        return apiFetch('/financial-agents/draft', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    createAgent: async (data: any) => {
        return apiFetch('/financial-agents', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    listAgents: async () => apiFetch('/financial-agents'),
    getAgent: async (id: string) => apiFetch(`/financial-agents/${id}`),
    pauseAgent: async (id: string) =>
        apiFetch(`/financial-agents/${id}/pause`, { method: 'POST', body: JSON.stringify({}) }),
    activateAgent: async (id: string) =>
        apiFetch(`/financial-agents/${id}/activate`, { method: 'POST', body: JSON.stringify({}) }),
    getWorkspaceEvents: async () => apiFetch('/financial-agents/events'),
    getAgentEvents: async (id: string) => apiFetch(`/financial-agents/${id}/events`),
    draftFromPrompt: async (name: string, description: string, preset: FinancialAgentPreset) => {
        return apiFetch('/financial-agents/draft', {
            method: 'POST',
            body: JSON.stringify({ name, description, preset }),
        });
    },
    createFromStructured: async (draft: any) => {
        return apiFetch('/financial-agents', {
            method: 'POST',
            body: JSON.stringify(draft),
        });
    },
};
