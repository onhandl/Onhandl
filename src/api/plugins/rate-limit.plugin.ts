import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimiter } from '../../infrastructure/rate-limit/rate-limiter';

export default fp(async (fastify) => {
    fastify.decorate('rateLimit', async (request: FastifyRequest, reply: FastifyReply, options: { limit: number; windowMs: number; category: string }) => {
        // Use API key ID if present, otherwise fallback to User ID from JWT
        const identifier = request.apiKeyAuth?.apiKeyId || (request.user as any)?.id;

        if (!identifier) return; // Should not happen on protected routes

        const result = await rateLimiter.check(identifier, options.limit, options.windowMs, options.category);

        reply.header('X-RateLimit-Limit', options.limit);
        reply.header('X-RateLimit-Remaining', result.remaining);
        reply.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

        if (!result.success) {
            return reply.code(429).send({
                error: 'Too Many Requests',
                message: `Rate limit exceeded for category: ${options.category}. Please try again later.`,
                resetAt: new Date(result.resetAt).toISOString()
            });
        }
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        rateLimit: (request: FastifyRequest, reply: FastifyReply, options: { limit: number; windowMs: number; category: string }) => Promise<void>;
    }
}
