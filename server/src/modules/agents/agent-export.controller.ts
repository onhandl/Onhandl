import { FastifyPluginAsync } from 'fastify';
import { ENV } from '../../shared/config/environments';
import {
    enableEmbed, exportPwa, enableMcp, getEmbedMeta, checkEmbedAccess, streamEmbedChat,
} from './agent-export.service';
import { cookieAuthSecurity, idParamSchema, standardErrorResponses } from '../../shared/docs';

export const exportRoutes: FastifyPluginAsync = async (fastify) => {

    fastify.post<{ Params: { id: string }; Body: { allowedDomains?: string[]; allowedIPs?: string[]; theme?: string } }>(
        '/agents/:id/export/embed', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Enable embed for agent',
            description: 'Configures and enables the embeddable chat widget for an agent. Generates an embed token scoped to the allowed domains and IPs.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            body: {
                type: 'object',
                properties: {
                    allowedDomains: { type: 'array', items: { type: 'string' }, description: 'Allowed origin domains' },
                    allowedIPs: { type: 'array', items: { type: 'string' }, description: 'Allowed IP addresses' },
                    theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
                },
            },
            response: {
                200: { description: 'Embed settings saved', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    },
        async (request, reply) => {
            try {
                const { allowedDomains = [], allowedIPs = [], theme = 'dark' } = request.body || {};
                return await enableEmbed(request.params.id, allowedDomains, allowedIPs, theme);
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.post<{ Params: { id: string } }>('/agents/:id/export/pwa', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Export agent as PWA',
            description: 'Generates a Progressive Web App manifest and configuration so the agent can be installed standalone on mobile and desktop.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'PWA export data', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await exportPwa(request.params.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Params: { id: string } }>('/agents/:id/export/mcp', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Agents'],
            summary: 'Export agent as MCP server',
            description: 'Enables Model Context Protocol (MCP) server mode for the agent.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'MCP settings saved', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await enableMcp(request.params.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    // Public embed routes — no auth required
    fastify.get<{ Params: { id: string } }>('/embed/agent/:id', {
        schema: {
            tags: ['Agents'],
            summary: 'Get embed metadata',
            description: 'Returns the public embed configuration for the specified agent. Used by the embed widget to initialize.',
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'Embed metadata', type: 'object', additionalProperties: true },
                ...standardErrorResponses([403, 500]),
            },
        },
    }, async (request, reply) => {
        try { return await getEmbedMeta(request.params.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post<{ Params: { id: string }; Body: { prompt: string; sessionId?: string } }>(
        '/embed/agent/:id/chat', {
        schema: {
            tags: ['Agents'],
            summary: 'Send message to embedded agent (SSE)',
            description: 'Sends a prompt to the agent embed chat and streams the response via SSE. Access is controlled by the allowedDomains/allowedIPs configured during embed setup.',
            params: idParamSchema('Agent ID'),
            body: {
                type: 'object',
                required: ['prompt'],
                properties: {
                    prompt: { type: 'string' },
                    sessionId: { type: 'string', description: 'Optional session ID for conversation continuity' },
                },
            },
            response: {
                200: { description: 'SSE stream of agent response', type: 'string' },
                ...standardErrorResponses([400, 403, 500]),
            },
        },
    },
        async (request, reply) => {
            const { id } = request.params;
            const { prompt, sessionId = `embed_${id}_${Date.now()}` } = request.body;
            if (!prompt?.trim()) return reply.code(400).send({ error: 'prompt is required' });
            try {
                const meta = await getEmbedMeta(id);
                if (ENV.NODE_ENV === 'production') {
                    const forwarded = request.headers['x-forwarded-for'];
                    const clientIP = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || request.ip;
                    const origin = (request.headers['origin'] as string) || '';
                    const access = checkEmbedAccess({ exportSettings: meta }, clientIP, origin);
                    if (!access.allowed) return reply.code(403).send({ error: access.reason });
                }
                const readable = await streamEmbedChat(id, prompt, sessionId);
                return reply
                    .header('Content-Type', 'text/event-stream').header('Cache-Control', 'no-cache')
                    .header('Connection', 'keep-alive').header('Access-Control-Allow-Origin', '*').send(readable);
            } catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );
};
