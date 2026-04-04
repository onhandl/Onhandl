import { FastifyRequest, FastifyReply } from 'fastify'
import { AgentCard } from '../../../models/AgentCard'
import { resolveChannelConfig, connectPeer, openChannel, listChannels, shutdownChannel, getNodeInfo, listPeers } from '../../../services/fiber/ChannelManager'

function getUser(req: FastifyRequest): string | null {
    const c = (req as any).cookies?.['auth_token']
    if (!c) return null
    try { return (req.server.jwt.verify(c) as any).id } catch { return null }
}

// POST /api/fiber/peer/connect
export async function handleConnectPeer(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId, network = 'CKB', address, save = false } = request.body as any
    if (!agentId || !address) return reply.code(400).send({ error: 'agentId and address are required' })

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `Agent has no ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        await connectPeer(cfg, address, save)
        return { connected: true, address, message: 'Peer connected. Wait ~1s then call open_channel or list_peers for pubkey.' }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}

// GET /api/fiber/peers/:agentId
export async function handleListPeers(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId } = request.params as any
    const { network = 'CKB' } = request.query as any

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `No ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        const peers = await listPeers(cfg)
        return { peers }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}

// POST /api/fiber/channel/open
export async function handleOpenChannel(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId, network = 'CKB', pubkey, fundingAmount, isPublic = true } = request.body as any
    if (!agentId || !fundingAmount) return reply.code(400).send({ error: 'agentId and fundingAmount are required' })
    if (!pubkey) return reply.code(400).send({ error: 'pubkey is required (hex pubkey from list_peers)' })

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `Agent has no ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        const result = await openChannel(cfg, pubkey, fundingAmount, isPublic)
        return { result, message: 'Channel open initiated. Poll /api/fiber/channels/:agentId until state_name = CHANNEL_READY.' }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}

// POST /api/fiber/channel/close
export async function handleCloseChannel(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId, network = 'CKB', channelId, closeAddressArgs, feeRate } = request.body as any
    if (!agentId || !channelId || !closeAddressArgs) return reply.code(400).send({ error: 'agentId, channelId, and closeAddressArgs are required' })

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `No ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        const result = await shutdownChannel(cfg, channelId, closeAddressArgs, feeRate)
        return { result, message: 'Channel shutdown initiated' }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}

// GET /api/fiber/channels/:agentId
export async function handleListChannels(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId } = request.params as any
    const { network = 'CKB', peer_id, pubkey, include_closed } = request.query as any

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `No ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        const channels = await listChannels(cfg, { peer_id, pubkey, include_closed: include_closed === 'true' })
        return { channels }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}

// GET /api/fiber/node-info/:agentId
export async function handleNodeInfo(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { agentId } = request.params as any
    const { network = 'CKB' } = request.query as any

    const card = await AgentCard.findOne({ agentId, ownerId: userId })
    if (!card) return reply.code(404).send({ error: 'Agent card not found' })

    const net = card.networks.find(n => n.network === network)
    if (!net) return reply.code(400).send({ error: `No ${network} network configured` })

    const cfg = resolveChannelConfig(net)
    try {
        const info = await getNodeInfo(cfg)
        return { info }
    } catch (err: any) {
        return reply.code(502).send({ error: 'Fiber node error', details: err.message })
    }
}
