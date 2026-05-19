import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '../../shared/contracts/auth';
import crypto from 'crypto';
import { TerminalSession } from '../../infrastructure/database/models/TerminalSession';

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorate(
    'authenticate',
    async function authenticate(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  fastify.decorate(
    'authorizeAdmin',
    async function authorizeAdmin(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> {
      try {
        await request.jwtVerify();

        if (!request.user?.isAdmin) {
          return reply.code(403).send({ error: 'Admin access required' });
        }
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  fastify.decorate(
    'authenticateTerminal',
    async function authenticateTerminal(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.code(401).send({ error: 'Missing or invalid authentication token' });
        }

        const rawToken = authHeader.split(' ')[1];
        if (!rawToken) throw new Error('No token found');

        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Look up terminal session by matching hash
        const session = await TerminalSession.findOne({
          hashedAccessToken: hashedToken,
          status: 'approved',
          revoked: false
        }).lean();

        if (!session) {
          return reply.code(401).send({ error: 'Invalid, revoked, or expired terminal session' });
        }

        // Attach terminal session context
        request.user = {
          id: session.userId?.toString() || '',
          workspaceId: session.workspaceId?.toString(),
          type: 'terminal'
        };
      } catch (err) {
        return reply.code(401).send({ error: 'Terminal authentication failed' });
      }
    }
  );

  fastify.decorate(
    'authenticateAny',
    async function authenticateAny(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> {
      // 1. Try standard JWT (Cookie or Auth Header)
      try {
        await request.jwtVerify();
        return; // Success
      } catch (err) {
        // Continue to terminal auth
      }

      // 2. Try Terminal Opaque Token
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.split(' ')[1].includes('.')) {
        try {
          const rawToken = authHeader.split(' ')[1];
          const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

          const session = await TerminalSession.findOne({
            hashedAccessToken: hashedToken,
            status: 'approved',
            revoked: false
          }).lean();

          if (session) {
            request.user = {
              id: session.userId?.toString() || '',
              workspaceId: session.workspaceId?.toString(),
              type: 'terminal'
            };
            return; // Success
          }
        } catch (err) {
          // Ignore terminal auth error and fall through to 401
        }
      }

      return reply.code(401).send({ error: 'Authentication failed' });
    }
  );
}

export default fp(authPlugin, {
  name: 'auth-plugin',
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;

    authorizeAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;

    authenticateTerminal: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;

    authenticateAny: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}