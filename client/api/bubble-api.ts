import { apiFetch } from '@/lib/api-client';

export const gossipApi = {
    catalogs:           () => apiFetch('/gossip/catalogs'),
    subscriptions:      () => apiFetch('/gossip/subscriptions'),
    getSubscription:    (agentId: string) => apiFetch(`/gossip/subscriptions/${agentId}`),
    subscribe:          (agentId: string, catalog: string, interfaces: string[]) =>
                            apiFetch('/gossip/subscribe', { method: 'POST', body: JSON.stringify({ agentId, catalog, interfaces }) }),
    unsubscribe:        (agentId: string) => apiFetch(`/gossip/subscriptions/${agentId}`, { method: 'DELETE' }),
    checkCompatibility: (agentIds: string[], requiredInterfaces: string[]) =>
                            apiFetch('/gossip/check-compatibility', { method: 'POST', body: JSON.stringify({ agentIds, requiredInterfaces }) }),
};

const STREAM_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

export const bubbleApi = {
    list: () => apiFetch('/bubbles'),

    get: (id: string) => apiFetch(`/bubbles/${id}`),

    create: (data: {
        name: string;
        description?: string;
        agentIds?: string[];
        gossipInterval?: number;
        fanout?: number;
    }) => apiFetch('/bubbles', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: {
        name?: string;
        description?: string;
        agentIds?: string[];
        status?: 'active' | 'paused' | 'archived';
        gossipInterval?: number;
        fanout?: number;
    }) => apiFetch(`/bubbles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string) => apiFetch(`/bubbles/${id}`, { method: 'DELETE' }),

    getMessages: (id: string, params?: { limit?: number; page?: number }) => {
        const qs = params ? new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])).toString() : '';
        return apiFetch(`/bubbles/${id}/messages${qs ? `?${qs}` : ''}`);
    },

    submitTask: (id: string, task: string) =>
        apiFetch(`/bubbles/${id}/task`, { method: 'POST', body: JSON.stringify({ task }) }),

    /** Returns an EventSource connected to the bubble's SSE stream */
    openStream: (id: string): EventSource => {
        return new EventSource(`${STREAM_BASE}/bubbles/${id}/stream`, { withCredentials: true });
    },

    getSubscription: (agentId: string) => apiFetch(`/gossip/subscriptions/${agentId}`),
};
