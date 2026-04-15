import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AgentDefinition } from '../../../infrastructure/database/models/AgentDefinition';
import { Orchestrator } from '../../../core/engine/orchestrator';

const MCP_PROTOCOL_VERSION = '2025-03-26';

export const mcpRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Params: { id: string } }>(
        '/agent/:id',
        async (request, reply) => {
            const { id } = request.params;
            const body = request.body as any;

            const agent = await AgentDefinition.findById(id).catch(() => null);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });
            if (!agent.exportSettings?.mcpEnabled) {
                return reply.code(403).send({ error: 'MCP not enabled for this agent' });
            }

            const { jsonrpc, id: reqId, method, params } = body || {};

            if (jsonrpc !== '2.0') {
                return reply.code(400).send({
                    jsonrpc: '2.0', id: reqId ?? null,
                    error: { code: -32600, message: 'Invalid Request — jsonrpc must be "2.0"' },
                });
            }

            if (method === 'initialize') {
                return { jsonrpc: '2.0', id: reqId, result: { protocolVersion: MCP_PROTOCOL_VERSION, serverInfo: { name: agent.name, version: '1.0.0' }, capabilities: { tools: {} } } };
            }
            if (method === 'notifications/initialized') return reply.code(202).send();

            if (method === 'tools/list') {
                return {
                    jsonrpc: '2.0', id: reqId,
                    result: {
                        tools: [{
                            name: 'chat',
                            description: agent.description || `Send a message to ${agent.name} and get a response.`,
                            inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'The message to send to the agent' }, sessionId: { type: 'string', description: 'Optional session ID for conversation continuity' } }, required: ['prompt'] },
                        }],
                    },
                };
            }

            if (method === 'tools/call') {
                const { name: toolName, arguments: args } = params || {};
                if (toolName !== 'chat') return { jsonrpc: '2.0', id: reqId, error: { code: -32601, message: `Unknown tool: ${toolName}` } };
                const { prompt, sessionId = `mcp_${id}_${Date.now()}` } = args || {};
                if (!prompt?.trim()) return { jsonrpc: '2.0', id: reqId, error: { code: -32602, message: 'Invalid params — prompt is required' } };
                try {
                    const text = await collectAgentResponse(prompt, id, sessionId);
                    return { jsonrpc: '2.0', id: reqId, result: { content: [{ type: 'text', text }], isError: false } };
                } catch (err: any) {
                    return { jsonrpc: '2.0', id: reqId, result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true } };
                }
            }

            return { jsonrpc: '2.0', id: reqId ?? null, error: { code: -32601, message: `Method not found: ${method}` } };
        }
    );
};

async function collectAgentResponse(prompt: string, agentId: string, sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const readable = new Readable({ read() { } });
        const chunks: string[] = [];
        readable.on('data', (chunk: Buffer) => {
            const lines = chunk.toString().split('\n\n');
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try { const json = JSON.parse(line.slice(6)); if (typeof json.content === 'string') chunks.push(json.content); } catch { /* skip */ }
            }
        });
        readable.on('end', () => resolve(chunks.join('').trim() || 'No response generated'));
        readable.on('error', reject);
        Orchestrator.handleQuery(prompt, agentId, 'mcp_user', sessionId, readable)
            .then(() => readable.push(null))
            .catch((err: any) => { readable.push(null); reject(err); });
    });
}
