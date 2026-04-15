import type { FastifyInstance, FastifyReply } from 'fastify';

interface JWTPayload {
    id: string;
    username: string;
}

/**
 * Reads and verifies the auth_token cookie. Returns the decoded payload or
 * sends a 401 and returns null. Callers must guard: `if (!decoded) return;`
 */
export function verifyAuthCookie(
    fastify: FastifyInstance,
    cookies: Record<string, string | undefined>,
    reply: FastifyReply
): JWTPayload | null {
    const token = cookies['auth_token'];
    if (!token) {
        reply.code(401).send({ error: 'Unauthorized' });
        return null;
    }
    try {
        return fastify.jwt.verify<JWTPayload>(token);
    } catch {
        reply.code(401).send({ error: 'Invalid token' });
        return null;
    }
}
