import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { AgentNode } from '../../infrastructure/database/models/AgentNode';
import { AgentEdge } from '../../infrastructure/database/models/AgentEdge';
import { Orchestrator } from '../../core/engine/orchestrator';
import { ENV } from '../../shared/config/environments';
import { verifyAuthCookie } from '../../api/middlewares/auth';

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
    // ── Enable embed ──────────────────────────────────────────────────────────
    fastify.post<{
        Params: { id: string };
        Body: { allowedDomains?: string[]; allowedIPs?: string[]; theme?: string };
    }>('/agents/:id/export/embed', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { id } = request.params;
        const { allowedDomains = [], allowedIPs = [], theme = 'dark' } = request.body || {};

        const agent = await AgentDefinition.findById(id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const existing = agent.exportSettings || ({} as any);
        agent.exportSettings = {
            embedEnabled: true,
            allowedDomains,
            allowedIPs,
            theme,
            pwaDownloadCount: existing.pwaDownloadCount || 0,
            lastExportedAt: new Date(),
            mcpEnabled: existing.mcpEnabled || false,
        };
        await agent.save();

        const embedUrl = `${ENV.APP_URL}/embed/agent/${id}`;
        const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="400"\n  height="600"\n  frameborder="0"\n  allow="clipboard-write"\n></iframe>`;
        const scriptSnippet = `<script src="${embedUrl}/widget.js" defer></script>`;

        return { embedUrl, iframeSnippet, scriptSnippet };
    });

    // ── PWA config export ─────────────────────────────────────────────────────
    fastify.post<{ Params: { id: string } }>('/agents/:id/export/pwa', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { id } = request.params;
        const agent = await AgentDefinition.findById(id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const [nodes, edges] = await Promise.all([
            AgentNode.find({ agentId: id }),
            AgentEdge.find({ agentId: id }),
        ]);

        const existing = agent.exportSettings || ({} as any);
        agent.exportSettings = {
            embedEnabled: existing.embedEnabled || false,
            allowedDomains: existing.allowedDomains || [],
            allowedIPs: existing.allowedIPs || [],
            theme: existing.theme || 'dark',
            pwaDownloadCount: (existing.pwaDownloadCount || 0) + 1,
            lastExportedAt: new Date(),
            mcpEnabled: existing.mcpEnabled || false,
        };
        await agent.save();

        const agentConfig = {
            id: agent._id,
            name: agent.name,
            description: agent.description,
            agentType: agent.agentType,
            character: agent.character,
            modelProvider: agent.modelProvider,
            modelConfig: agent.modelConfig,
            graph: {
                nodes: nodes.map((n) => ({
                    id: n.nodeId, type: n.type, position: n.position,
                    data: { ...n.data, chain: n.chain, tool: n.tool, params: n.params },
                })),
                edges: edges.map((e) => ({
                    id: e.edgeId, source: e.source, target: e.target,
                    sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
                })),
            },
            apiUrl: ENV.API_URL,
            exportedAt: new Date().toISOString(),
        };

        return { agentConfig, agentName: agent.name };
    });

    // ── Enable MCP server ─────────────────────────────────────────────────────
    fastify.post<{ Params: { id: string } }>('/agents/:id/export/mcp', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { id } = request.params;
        const agent = await AgentDefinition.findById(id);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const existing = agent.exportSettings || ({} as any);
        agent.exportSettings = {
            ...existing,
            mcpEnabled: true,
            lastExportedAt: new Date(),
        };
        await agent.save();

        const serverBase = ENV.API_URL.replace(/\/api$/, '');
        const mcpEndpoint = `${serverBase}/mcp/agent/${id}`;

        return { mcpEndpoint, agentId: id, agentName: agent.name };
    });

    // ── Public embed metadata ─────────────────────────────────────────────────
    fastify.get<{ Params: { id: string } }>('/embed/agent/:id', async (request, reply) => {
        const { id } = request.params;
        const agent = await AgentDefinition.findById(id).catch(() => null);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        if (!agent.exportSettings?.embedEnabled)
            return reply.code(403).send({ error: 'Embed not enabled for this agent' });

        return {
            id: agent._id,
            name: agent.name,
            description: agent.description,
            agentType: agent.agentType,
            character: {
                bio: (agent.character as any)?.bio,
                personality: (agent.character as any)?.personality,
                name: (agent.character as any)?.name,
            },
            theme: agent.exportSettings.theme || 'dark',
            apiUrl: ENV.API_URL,
        };
    });

    // ── Public embed chat (SSE) ───────────────────────────────────────────────
    // Global CORS (dev: open / prod: whitelist) handles preflight.
    // This endpoint additionally enforces per-agent IP/domain access in production.
    fastify.post<{
        Params: { id: string };
        Body: { prompt: string; sessionId?: string };
    }>('/embed/agent/:id/chat', async (request, reply) => {
        const { id } = request.params;
        const { prompt, sessionId = `embed_${id}_${Date.now()}` } = request.body;

        if (!prompt?.trim()) return reply.code(400).send({ error: 'prompt is required' });

        const agent = await AgentDefinition.findById(id).catch(() => null);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        if (!agent.exportSettings?.embedEnabled)
            return reply.code(403).send({ error: 'Embed not enabled for this agent' });

        // Production IP / domain access control
        if (ENV.NODE_ENV === 'production') {
            const { allowedIPs = [], allowedDomains = [] } = agent.exportSettings;
            if (allowedIPs.length > 0 || allowedDomains.length > 0) {
                const forwarded = request.headers['x-forwarded-for'];
                const clientIP = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()
                    || request.ip;
                const origin = (request.headers['origin'] as string) || '';

                const ipOk = allowedIPs.length === 0 || allowedIPs.some((ip: string) => clientIP.startsWith(ip));
                const domainOk = allowedDomains.length === 0 || allowedDomains.some((d: string) => origin.includes(d));

                if (!ipOk && !domainOk) {
                    return reply.code(403).send({
                        error: 'This agent is not authorized for your IP address',
                    });
                }
            }
        }

        const readable = new Readable({ read() { } });

        Orchestrator.handleQuery(prompt, id, 'embed_user', sessionId, readable)
            .then(() => {
                console.log('[Embed Chat] Orchestrator completed for agent', id);
                readable.push(null);
            })
            .catch((err: any) => {
                console.error('[Embed Chat] Orchestrator error:', err);
                readable.push(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                readable.push(null);
            });

        return reply
            .header('Content-Type', 'text/event-stream')
            .header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive')
            .header('Access-Control-Allow-Origin', '*')
            .send(readable);
    });
};
