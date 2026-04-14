/**
 * Agent Control — /agent start and /agent stop super-commands.
 *
 * These are emergency controls that can interrupt a running agent at any time.
 * When stopped: the AgentDefinition.status = 'stopped' and all A2A messages
 * are rejected. When started: status = 'running' and the AgentCard becomes 'active'.
 *
 * The AgentCard.status tracks registry visibility; AgentDefinition.status tracks
 * whether the agent is permitted to execute.
 */
import { FastifyRequest, FastifyReply } from 'fastify'
import { AgentDefinition } from '../../models/AgentDefinition'
import { AgentCommand } from '../../models/AgentCommand'

function getUser(req: FastifyRequest): string | null {
    const c = (req as any).cookies?.['auth_token']
    if (!c) return null
    try { return (req.server.jwt.verify(c) as any).id } catch { return null }
}

// POST /api/agents/:id/start
export async function startAgent(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { id } = request.params as any
    const { reason } = (request.body as any) || {}

    const agent = await AgentDefinition.findOne({ _id: id, ownerId: userId })
    if (!agent) return reply.code(404).send({ error: 'Agent not found' })
    if (agent.isDraft) return reply.code(400).send({ error: 'Cannot start a draft agent' })

    await AgentDefinition.updateOne({ _id: id }, { status: 'running' })

    await AgentCommand.create({ agentId: id, issuedBy: userId, command: 'start', reason })

    return { agentId: id, status: 'running', message: 'Agent started' }
}

// POST /api/agents/:id/stop
export async function stopAgent(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { id } = request.params as any
    const { reason } = (request.body as any) || {}

    const agent = await AgentDefinition.findOne({ _id: id, ownerId: userId })
    if (!agent) return reply.code(404).send({ error: 'Agent not found' })

    await AgentDefinition.updateOne({ _id: id }, { status: 'stopped' })

    await AgentCommand.create({ agentId: id, issuedBy: userId, command: 'stop', reason })

    return { agentId: id, status: 'stopped', message: 'Agent stopped. All active sessions will be blocked.' }
}

// GET /api/agents/:id/status
export async function getAgentStatus(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { id } = request.params as any
    const agent = await AgentDefinition.findOne({ _id: id, ownerId: userId }).select('status name isDraft')
    if (!agent) return reply.code(404).send({ error: 'Agent not found' })

    const lastCommand = await AgentCommand.findOne({ agentId: id }).sort({ createdAt: -1 })

    return {
        agentId: id,
        name: agent.name,
        status: agent.status,
        isDraft: agent.isDraft,
        lastCommand: lastCommand ? { command: lastCommand.command, reason: lastCommand.reason, at: lastCommand.createdAt } : null,
    }
}

// GET /api/agents/:id/commands
export async function getCommandHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUser(request)
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const { id } = request.params as any
    const agent = await AgentDefinition.findOne({ _id: id, ownerId: userId }).select('_id')
    if (!agent) return reply.code(403).send({ error: 'Not authorized' })

    const commands = await AgentCommand.find({ agentId: id }).sort({ createdAt: -1 }).limit(50)
    return { commands }
}
