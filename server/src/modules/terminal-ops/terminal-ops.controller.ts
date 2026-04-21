import { FastifyReply, FastifyRequest } from 'fastify';
import { listAgents } from '../agents/agent.service.js';
import { ExecutionService } from '../executions/execution.service.js';
import { executionEmitter } from '../executions/execution.events.js';
import { AiService } from '../ai/ai.service.js';
import { UserService } from '../users/user.service.js';
import { Readable } from 'stream';

export const TerminalOpsController = {
    async getMe(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user?.id;
        if (!userId) return reply.code(401).send({ error: 'User not identified' });

        try {
            const profile = await UserService.getProfile(userId, 'username email name plan tokens profileViews');
            return {
                id: userId,
                username: (profile as any).username || null,
                email: (profile as any).email || null,
                name: (profile as any).name || null,
                plan: (profile as any).plan || 'free',
                tokens: (profile as any).tokens || 0,
                workspaceId: request.user?.workspaceId,
            };
        } catch (e: any) {
            return reply.code(e.code || 500).send({ error: e.message });
        }
    },

    async listAgents(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user?.id;
        if (!userId) return reply.code(401).send({ error: 'User not identified' });

        const agents = await listAgents(userId, { status: 'published' });
        return {
            agents: agents.map(a => ({
                id: a._id,
                name: a.name,
                agentType: a.agentType,
                isDraft: a.isDraft,
                createdAt: a.createdAt
            }))
        };
    },

    async startExecution(request: FastifyRequest<{ Body: { agentId: string, initialState?: any } }>, reply: FastifyReply) {
        const { agentId, initialState } = request.body;
        if (!agentId) return reply.code(400).send({ error: 'agentId is required' });

        const auth: any = {
            type: 'terminal',
            userId: request.user?.id!,
            workspaceId: request.user?.workspaceId!
        };
        try {
            const execution = await ExecutionService.start(agentId, auth, initialState);
            return {
                executionId: execution._id,
                status: execution.status,
                message: 'Execution started successfully'
            };
        } catch (error: any) {
            return reply.code(error.code || 500).send({ error: error.message });
        }
    },

    async watchExecution(request: FastifyRequest<{ Params: { executionId: string } }>, reply: FastifyReply) {
        const { executionId } = request.params;
        const userId = request.user?.id;

        // Verify ownership/access
        try {
            await ExecutionService.getById(executionId, {
                type: 'terminal',
                userId: userId!,
                workspaceId: request.user?.workspaceId
            });
        } catch (error: any) {
            return reply.code(error.code || 403).send({ error: error.message });
        }

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        const onEvent = (data: any) => {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const eventName = `execution-${executionId}`;
        executionEmitter.on(eventName, onEvent);

        request.raw.on('close', () => {
            executionEmitter.off(eventName, onEvent);
        });
    },

    async chatStream(request: FastifyRequest<{ Params: { agentId: string }, Body: { messages: any[] } }>, reply: FastifyReply) {
        const { agentId } = request.params;
        const { messages } = request.body;

        try {
            const stream = await AiService.generateStream({
                agentId,
                messages,
                provider: 'gemini' // Default for terminal if not specified
            });

            const readable = Readable.from((async function* () {
                try {
                    for await (const chunk of stream) {
                        if (chunk) yield `data: ${JSON.stringify({ content: chunk })}\n\n`;
                    }
                } catch (err: any) {
                    yield `data: ${JSON.stringify({ error: err.message })}\n\n`;
                }
            })());

            return reply
                .header('Content-Type', 'text/event-stream')
                .header('Cache-Control', 'no-cache')
                .header('Connection', 'keep-alive')
                .send(readable);
        } catch (error: any) {
            return reply.code(error.code || 500).send({ error: error.message });
        }
    }
};
