import { FastifyInstance } from 'fastify';
import { SupportTicket } from '../../infrastructure/database/models/SupportTicket';
import { User } from '../../infrastructure/database/models/User';

async function verifyAuth(request: any, reply: any, fastify: FastifyInstance) {
    const token = request.cookies['auth_token'];
    if (!token) { reply.code(401).send({ error: 'Unauthorized' }); return null; }
    try { return fastify.jwt.verify(token) as { id: string; username: string }; }
    catch { reply.code(401).send({ error: 'Invalid token' }); return null; }
}

export async function supportController(fastify: FastifyInstance) {
    fastify.post('/tickets', async (request: any, reply) => {
        const decoded = await verifyAuth(request, reply, fastify);
        if (!decoded) return;

        const user = await User.findById(decoded.id).lean();
        if (!user) return reply.code(404).send({ error: 'User not found' });

        const { subject, message } = request.body as any;
        if (!subject || !message) return reply.code(400).send({ error: 'subject and message are required' });

        const ticket = await SupportTicket.create({
            userId: decoded.id,
            userEmail: (user as any).email ?? '',
            userName: (user as any).name ?? (user as any).username ?? 'Unknown',
            subject,
            message,
        });
        return reply.code(201).send(ticket);
    });

    fastify.get('/tickets', async (request: any, reply) => {
        const decoded = await verifyAuth(request, reply, fastify);
        if (!decoded) return;
        const tickets = await SupportTicket.find({ userId: decoded.id }).sort({ createdAt: -1 }).lean();
        return reply.send(tickets);
    });
}
