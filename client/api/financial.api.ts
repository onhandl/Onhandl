import { apiFetch } from '@/lib/api-client';

export type FinancialAgentPreset = 'conservative_treasury' | 'balanced_allocator' | 'aggressive_allocator';

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
    draftFromPrompt: async (name: string, prompt: string, preset?: FinancialAgentPreset) => {
        return apiFetch('/financial-agents/draft', {
            method: 'POST',
            body: JSON.stringify({ mode: 'prompt', name, prompt, preset }),
        });
    },
    createFromStructured: async (draft: any) => {
        return apiFetch('/financial-agents', {
            method: 'POST',
            body: JSON.stringify({ mode: 'structured', draft }),
        });
    },
    getAgentBalance: async (id: string) => apiFetch(`/financial-agents/${id}/balance`),
};
