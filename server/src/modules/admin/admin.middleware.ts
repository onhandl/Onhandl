import { FastifyInstance } from 'fastify';
import { User } from '../../infrastructure/database/models/User';

export async function requireAdmin(request: any, reply: any, fastify: FastifyInstance) {
    const token = request.cookies['auth_token'];
    if (!token) { reply.code(401).send({ error: 'Unauthorized' }); return null; }
    let decoded: { id: string; username: string };
    try { decoded = fastify.jwt.verify(token) as any; }
    catch { reply.code(401).send({ error: 'Invalid token' }); return null; }

    const user = await User.findById(decoded.id).lean();
    if (!user?.isAdmin) { reply.code(403).send({ error: 'Admin access required' }); return null; }
    return { decoded, user };
}
