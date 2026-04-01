import { apiFetch } from './api-client';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

export const agentApi = {
    loadAgents: async () => apiFetch('/agents'),

    getRevenue: async () => apiFetch('/agents/revenue'),

    getPlanStatus: async () => apiFetch('/agents/plan-status'),

    enhancePersona: async (name: string, persona: string, provider?: string, apiKey?: string, model?: string, agentType?: string) =>
        apiFetch('/agents/enhance', { method: 'POST', body: JSON.stringify({ name, persona, provider, apiKey, model, agentType }) }),

    saveAgent: async (name: string, graph?: { nodes: any[]; edges: any[] }, persona?: string, description?: string, isDraft = true, provider?: string, apiKey?: string, character?: any, agentType?: string, chain?: string) =>
        apiFetch('/agents', { method: 'POST', body: JSON.stringify({ name, persona, description, graph, isDraft, provider, apiKey, character, agentType, chain }) }),

    updateAgent: async (id: string, updates: { name?: string; description?: string; persona?: string; graph?: { nodes: any[]; edges: any[] }; identities?: any; isDraft?: boolean; provider?: string; apiKey?: string; character?: any }) =>
        apiFetch(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

    getAgent: async (id: string) => apiFetch(`/agents/${id}`),

    deleteAgent: async (id: string) => apiFetch(`/agents/${id}`, { method: 'DELETE' }),

    getTemplates: async () => apiFetch('/templates'),

    createAgentFromTemplate: async (templateId: string, name: string, modelProvider?: string, modelName?: string, apiKey?: string) =>
        apiFetch('/agents/from-template', { method: 'POST', body: JSON.stringify({ templateId, name, modelProvider, modelName, apiKey }) }),

    chatWithAgent: async (provider: string, model: string, messages: any[], apiKey?: string) =>
        apiFetch('/ai/complete', { method: 'POST', body: JSON.stringify({ provider, model, messages, apiKey }) }),

    chatWithAgentStream: async (provider: string, model: string, messages: any[], apiKey?: string, agentId?: string, sessionId?: string) => {
        let url = `${BASE}/ai/stream`;
        let body: any = { provider, model, messages, agentId };

        if (agentId) {
            url = `${BASE}/agent/query`;
            const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
            body = { prompt: lastUserMsg?.content || '', agentId, sessionId: sessionId || `session_${agentId}_${Date.now()}` };
        }

        const headers: any = { 'Content-Type': 'application/json' };
        const effectiveApiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem(`${provider.toLowerCase()}_api_key`) : null);
        if (effectiveApiKey) headers['x-ai-api-key'] = effectiveApiKey;

        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), credentials: 'include' });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || response.statusText);
        }
        return response.body?.getReader();
    },

    // ── Export ────────────────────────────────────────────────────────────────
    exportEmbed: async (id: string, options: { allowedDomains?: string[]; allowedIPs?: string[]; theme?: string } = {}) =>
        apiFetch(`/agents/${id}/export/embed`, { method: 'POST', body: JSON.stringify(options) }),

    exportPwa: async (id: string) =>
        apiFetch(`/agents/${id}/export/pwa`, { method: 'POST', body: JSON.stringify({}) }),

    getEmbedAgent: async (id: string) => {
        const res = await fetch(`${BASE}/embed/agent/${id}`);
        if (!res.ok) throw new Error('Agent embed not available');
        return res.json();
    },

    // ── Marketplace ───────────────────────────────────────────────────────────
    getMarketplace: async (params: { category?: string; pricing?: string; network?: string; search?: string; page?: number; limit?: number } = {}) => {
        const qs = new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString();
        return apiFetch(`/marketplace${qs ? `?${qs}` : ''}`);
    },

    getMarketplaceAgent: async (id: string) => apiFetch(`/marketplace/${id}`),

    publishToMarketplace: async (id: string, settings: { published?: boolean; category?: string; visibility?: string; pricing?: any; paymentMethods?: any }) =>
        apiFetch(`/marketplace/${id}/publish`, { method: 'POST', body: JSON.stringify(settings) }),

    getMyPurchases: async () => apiFetch('/marketplace/purchases/mine'),

    useMarketplaceAgent: async (id: string) =>
        apiFetch(`/marketplace/${id}/use`, { method: 'POST', body: JSON.stringify({}) }),

    // ── Payments ──────────────────────────────────────────────────────────────
    getStripeConnectUrl: async () => apiFetch('/payments/stripe/connect-url'),

    getStripeStatus: async () => apiFetch('/payments/stripe/status'),

    createStripeCheckout: async (agentId: string) =>
        apiFetch(`/payments/stripe/checkout/${agentId}`, { method: 'POST', body: JSON.stringify({}) }),

    submitCryptoPurchase: async (agentId: string, txHash: string, network: string) =>
        apiFetch(`/payments/crypto/purchase/${agentId}`, { method: 'POST', body: JSON.stringify({ txHash, network }) }),

    verifyCryptoPurchase: async (purchaseId: string) =>
        apiFetch(`/payments/crypto/verify/${purchaseId}`, { method: 'POST', body: JSON.stringify({}) }),

    getCryptoNetworks: async () => apiFetch('/payments/crypto/networks'),
};
