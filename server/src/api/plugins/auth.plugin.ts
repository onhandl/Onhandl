import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '../../shared/contracts/auth';

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
  }
}