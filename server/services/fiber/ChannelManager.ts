/**
 * ChannelManager — high-level Fiber channel lifecycle
 *
 * Wraps the Fiber JSON-RPC with per-agent node resolution.
 * "managed" = platform ENV node; "custom" = agent-supplied URL.
 *
 * Fiber RPC flow:
 *   1. connectPeer({ address: "/ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}" })
 *   2. openChannel({ pubkey (hex from list_peers), funding_amount (hex shannons), public })
 *   3. Poll listChannels until state_name === "CHANNEL_READY"
 */

const PLATFORM_FIBER_URL  = process.env.FIBER_NODE_URL   || 'http://localhost:8227'
const PLATFORM_FIBER_AUTH = process.env.FIBER_AUTH_TOKEN || ''

export async function fiberCall(method: string, params: any[], nodeUrl?: string, authToken?: string) {
    const url   = nodeUrl   || PLATFORM_FIBER_URL
    const token = authToken || PLATFORM_FIBER_AUTH

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.result
}

export interface ChannelConfig {
    fiberNodeUrl?: string   // undefined → managed (platform node)
    fiberAuthToken?: string
}

/**
 * Convert CKB amount to hex shannons.
 * "500"           → 500 CKB → 50_000_000_000 shannons → "0xba43b7400"
 * "0xba43b7400"  → passed through unchanged
 */
function toCkbHexShannons(amount: string): string {
    const raw = String(amount).trim()
    if (/^0x[0-9a-fA-F]+$/.test(raw)) return raw
    if (/^\d+$/.test(raw)) return '0x' + (BigInt(raw) * 100_000_000n).toString(16)
    throw new Error(`Invalid funding amount: "${amount}". Provide integer CKB (e.g. "500") or hex shannons (e.g. "0xba43b7400").`)
}

/**
 * Connect to a remote Fiber peer.
 * MUST be called before open_channel.
 * address: "/ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}"
 * Returns null on success (RPC contract).
 */
export async function connectPeer(cfg: ChannelConfig, address: string, save = false) {
    const params: any = { address }
    if (save) params.save = true
    return fiberCall('connect_peer', [params], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/**
 * List connected peers — use after connectPeer to get the remote peer's pubkey.
 */
export async function listPeers(cfg: ChannelConfig) {
    return fiberCall('list_peers', [], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/**
 * Open a payment channel.
 * pubkey: the peer's secp256k1 pubkey (hex) from list_peers → pubkey field.
 * fundingAmount: CKB decimal ("500") or hex shannons ("0xba43b7400").
 */
export async function openChannel(
    cfg: ChannelConfig,
    pubkey: string,
    fundingAmount: string,
    isPublic = true
) {
    return fiberCall('open_channel', [{
        pubkey: pubkey.trim(),
        funding_amount: toCkbHexShannons(fundingAmount),
        public: isPublic,
    }], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/**
 * List channels, optionally filtered by peer.
 */
export async function listChannels(cfg: ChannelConfig, filter?: { peer_id?: string; pubkey?: string; include_closed?: boolean }) {
    const params: Record<string, any> = {}
    if (filter?.peer_id) params.peer_id = filter.peer_id
    if (filter?.pubkey) params.pubkey = filter.pubkey
    if (filter?.include_closed) params.include_closed = true
    return fiberCall('list_channels', [params], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/**
 * Cooperatively close a channel via shutdown_channel.
 * closeAddressArgs: 20-byte hex lock arg of your CKB address.
 */
export async function shutdownChannel(
    cfg: ChannelConfig,
    channelId: string,
    closeAddressArgs: string,
    feeRate = '0x3FC'
) {
    return fiberCall('shutdown_channel', [{
        channel_id: channelId,
        close_script: {
            code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hash_type: 'type',
            args: closeAddressArgs,
        },
        fee_rate: feeRate,
    }], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/**
 * Get node info — includes pubkey, listen addresses.
 */
export async function getNodeInfo(cfg: ChannelConfig) {
    return fiberCall('node_info', [], cfg.fiberNodeUrl, cfg.fiberAuthToken)
}

/** Resolve ChannelConfig from AgentCard network entry */
export function resolveChannelConfig(network: { fiberNodeType?: string; fiberNodeUrl?: string }): ChannelConfig {
    if (network.fiberNodeType === 'custom') {
        if (!network.fiberNodeUrl) throw new Error('Custom Fiber node requires fiberNodeUrl')
        return { fiberNodeUrl: network.fiberNodeUrl }
    }
    // managed — use platform node
    return {}
}
