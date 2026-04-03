import { apiFetch } from './api-client'

export const fiberApi = {
    // ── Peer management (required before open_channel) ────────────────────────
    /**
     * Step 1: Connect to a remote peer.
     * address format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}
     * Wait ~1s after success before calling openChannel.
     */
    connectPeer: (agentId: string, address: string, network = 'CKB', save = false) =>
        apiFetch('/fiber/peer/connect', {
            method: 'POST',
            body: JSON.stringify({ agentId, network, address, save }),
        }),

    /**
     * Step 1b: List connected peers — get pubkey for open_channel.
     */
    listPeers: (agentId: string, network = 'CKB') =>
        apiFetch(`/fiber/peers/${agentId}?network=${network}`),

    // ── Channel lifecycle ─────────────────────────────────────────────────────
    /**
     * Step 2: Open a channel.
     * fundingAmount: CKB decimal ("500") or hex shannons ("0xba43b7400"). Min ~62 CKB.
     * Provide pubkey (preferred) or peer_id.
     */
    openChannel: (params: {
        agentId: string
        network?: string
        peer_id: string
        fundingAmount: string
        isPublic?: boolean
    }) =>
        apiFetch('/fiber/channel/open', { method: 'POST', body: JSON.stringify(params) }),

    /**
     * Step 3: Poll until state_name === 'CHANNEL_READY'.
     */
    listChannels: (agentId: string, network = 'CKB', filter?: { peer_id?: string; pubkey?: string; include_closed?: boolean }) => {
        const qs = new URLSearchParams({ network })
        if (filter?.peer_id) qs.set('peer_id', filter.peer_id)
        if (filter?.pubkey) qs.set('pubkey', filter.pubkey)
        if (filter?.include_closed) qs.set('include_closed', 'true')
        return apiFetch(`/fiber/channels/${agentId}?${qs}`)
    },

    /**
     * Step 4 (close): Cooperative channel shutdown.
     * closeAddressArgs: 20-byte hex lock arg of your CKB address.
     */
    closeChannel: (agentId: string, network: string, channelId: string, closeAddressArgs: string, feeRate?: string) =>
        apiFetch('/fiber/channel/close', {
            method: 'POST',
            body: JSON.stringify({ agentId, network, channelId, closeAddressArgs, feeRate }),
        }),

    nodeInfo: (agentId: string, network = 'CKB') =>
        apiFetch(`/fiber/node-info/${agentId}?network=${network}`),

    // ── Invoice ───────────────────────────────────────────────────────────────
    generateInvoice: (agentId: string, network: string, amountShannons?: string, description?: string) =>
        apiFetch('/fiber/invoice/generate', {
            method: 'POST',
            body: JSON.stringify({ agentId, network, amountShannons, description }),
        }),

    decodeInvoice: (agentId: string, network: string, invoice: string) =>
        apiFetch('/fiber/invoice/decode', {
            method: 'POST',
            body: JSON.stringify({ agentId, network, invoice }),
        }),

    // ── Payments ──────────────────────────────────────────────────────────────
    payAgent: (payload: {
        fromAgentId: string
        toAgentId: string
        network: string
        asset: string
        amount: string
        memo?: string
        txHash?: string
    }) =>
        apiFetch('/fiber/pay', { method: 'POST', body: JSON.stringify(payload) }),

    payInvoice: (agentId: string, network: string, invoice: string, feeLimit?: string) =>
        apiFetch('/fiber/pay-invoice', {
            method: 'POST',
            body: JSON.stringify({ agentId, network, invoice, feeLimit }),
        }),

    getPayments: (agentId: string, direction: 'sent' | 'received' | 'all' = 'all') =>
        apiFetch(`/fiber/payments/${agentId}?direction=${direction}`),

    paymentStatus: (paymentHash: string, agentId: string, network = 'CKB') =>
        apiFetch(`/fiber/payment-status/${paymentHash}?agentId=${agentId}&network=${network}`),
}

export const agentControlApi = {
    start: (agentId: string, reason?: string) =>
        apiFetch(`/agents/${agentId}/start`, { method: 'POST', body: JSON.stringify({ reason }) }),

    stop: (agentId: string, reason?: string) =>
        apiFetch(`/agents/${agentId}/stop`, { method: 'POST', body: JSON.stringify({ reason }) }),

    status: (agentId: string) =>
        apiFetch(`/agents/${agentId}/status`),

    commands: (agentId: string) =>
        apiFetch(`/agents/${agentId}/commands`),
}
