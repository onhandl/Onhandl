import { FastifyInstance } from 'fastify';
import { TerminalAuthService } from './terminal-auth.service';
import {
    standardErrorResponses,
    terminalSessionSchema,
    cookieAuthSecurity,
} from '../../shared/docs';

/**
 * TerminalAuthController: Endpoints for terminal CLI device-code authentication.
 */
export async function terminalAuthController(fastify: FastifyInstance) {

    const startSessionSchema = {
        tags: ['Terminal Operations'],
        summary: 'Start a terminal login session',
        description: 'Generates a device code and a user code. The terminal CLI uses the device code to poll for status, while the user visits the login URL to approve.',
        response: {
            200: {
                description: 'Session started',
                type: 'object',
                properties: {
                    deviceCode: { type: 'string' },
                    userCode: { type: 'string' },
                    loginUrl: { type: 'string' },
                    expiresIn: { type: 'number' },
                    pollInterval: { type: 'number' },
                },
            },
            ...standardErrorResponses([500]),
        },
    };

    // POST /terminal/auth/start - classic start
    fastify.post('/start', { schema: startSessionSchema }, async (_request, reply) => {
        try {
            const session = await TerminalAuthService.startLoginSession();
            return reply.send(session);
        } catch (e: any) {
            return reply.code(500).send({ error: e.message });
        }
    });

    // GET /terminal/auth/start - fallback for simple terminal clients
    fastify.get('/start', { schema: startSessionSchema }, async (_request, reply) => {
        try {
            const session = await TerminalAuthService.startLoginSession();
            return reply.send(session);
        } catch (e: any) {
            return reply.code(500).send({ error: e.message });
        }
    });

    // GET /terminal/auth/approve?userCode=... - redirect browser to frontend
    fastify.get<{ Querystring: { userCode: string } }>(
        '/approve',
        {
            schema: {
                tags: ['Terminal Operations'],
                summary: 'Redirect to approval page',
                description: 'Used as a convenience redirect. Takes the user directly to the frontend authorization screen with the provided userCode.',
                querystring: {
                    type: 'object',
                    required: ['userCode'],
                    properties: {
                        userCode: { type: 'string', description: 'The 8-character user code shown in the terminal' },
                    },
                },
                response: {
                    302: { type: 'null', description: 'Redirect to frontend' },
                },
            },
        },
        async (request, reply) => {
            const { userCode } = request.query;
            const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/api$/, '');
            const url = `${appUrl}/terminal/approve?userCode=${userCode}`;
            return reply.redirect(url);

        }
    );

    fastify.post<{ Body: { deviceCode: string } }>(
        '/poll',
        {
            schema: {
                tags: ['Terminal Operations'],
                summary: 'Poll terminal login status',
                description: 'The terminal CLI calls this until the user approves the session. If approved, it returns a high-entropy access token.',
                body: {
                    type: 'object',
                    required: ['deviceCode'],
                    properties: {
                        deviceCode: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        description: 'Session status',
                        type: 'object',
                        properties: {
                            status: { type: 'string', enum: ['pending', 'approved', 'denied', 'expired'] },
                            accessToken: { type: 'string', description: 'Only present once when status is approved' },
                            userId: { type: 'string' },
                            workspaceId: { type: 'string' },
                        },
                    },
                    ...standardErrorResponses([400, 500]),
                },
            },
        },
        async (request, reply) => {
            const { deviceCode } = request.body;
            if (!deviceCode) return reply.code(400).send({ error: 'deviceCode is required' });

            try {
                const status = await TerminalAuthService.pollSession(deviceCode);
                return reply.send(status);
            } catch (e: any) {
                return reply.code(400).send({ error: e.message });
            }
        }
    );

    fastify.post<{ Body: { deviceCode: string } }>(
        '/logout',
        {
            schema: {
                tags: ['Terminal Operations'],
                summary: 'Terminal logout (revoke by device code)',
                description: 'Called by the terminal CLI to immediately terminate and delete the current session by its device code.',
                body: {
                    type: 'object',
                    required: ['deviceCode'],
                    properties: {
                        deviceCode: { type: 'string' },
                    },
                },
                response: {
                    200: { description: 'Logged out', type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                },
            },
        },
        async (request, reply) => {
            const { deviceCode } = request.body;
            if (deviceCode) {
                await TerminalAuthService.logout(deviceCode);
            }
            return reply.send({ success: true, message: 'Logged out' });
        }
    );

    // Endpoint for browser to approve (should be authenticated!)
    fastify.post<{ Body: { userCode: string; workspaceId: string } }>(
        '/approve',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Terminal Operations'],
                summary: 'Authorize terminal session',
                description: 'Called by the web dashboard when the user clicks "Approve". Links the session to the user and workspace.',
                security: [cookieAuthSecurity],
                body: {
                    type: 'object',
                    required: ['userCode', 'workspaceId'],
                    properties: {
                        userCode: { type: 'string' },
                        workspaceId: { type: 'string' }
                    }
                },
                response: {
                    200: { description: 'Authorization successful', type: 'object', properties: { success: { type: 'boolean' } } },
                    ...standardErrorResponses([400, 401, 500]),
                }
            }
        },
        async (request, reply) => {
            const { userCode, workspaceId } = request.body;
            try {
                const deviceName = 'Onhandl Terminal CLI';
                await TerminalAuthService.approveSession(userCode, request.user.id, workspaceId, deviceName);
                return reply.send({ success: true });
            } catch (e: any) {
                return reply.code(400).send({ error: e.message });
            }
        }
    );

    // Get active terminal sessions for the user
    fastify.get(
        '/sessions',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Terminal Operations'],
                summary: 'List active terminal sessions',
                description: 'Returns all terminal sessions associated with the authenticated user for management and revocation.',
                security: [cookieAuthSecurity],
                response: {
                    200: {
                        description: 'List of sessions',
                        type: 'object',
                        properties: {
                            sessions: { type: 'array', items: terminalSessionSchema },
                        },
                    },
                    ...standardErrorResponses([401, 500])
                }
            }
        },
        async (request, reply) => {
            try {
                const sessions = await TerminalAuthService.getSessions(request.user.id);
                return reply.send({ sessions });
            } catch (e: any) {
                return reply.code(500).send({ error: e.message });
            }
        }
    );

    // Revoke a specific terminal session securely
    fastify.delete<{ Params: { id: string } }>(
        '/sessions/:id',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Terminal Operations'],
                summary: 'Revoke a specific session',
                description: 'Instantly deactivates a terminal session by its internal ID.',
                security: [cookieAuthSecurity],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' }
                    }
                },
                response: {
                    200: { description: 'Revocation successful', type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                    ...standardErrorResponses([400, 401, 403, 500])
                }
            }
        },
        async (request, reply) => {
            try {
                const result = await TerminalAuthService.revokeSession(request.params.id, request.user.id);
                return reply.send(result);
            } catch (e: any) {
                return reply.code(403).send({ error: e.message });
            }
        }
    );
}
