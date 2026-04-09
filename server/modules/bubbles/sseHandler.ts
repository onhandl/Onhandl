import { FastifyRequest, FastifyReply } from 'fastify';
import { Bubble } from '../../models/Bubble';
import { gossipEngine } from '../../engine/gossip/GossipEngine';

// GET /api/bubbles/:id/stream  — Server-Sent Events
export async function streamGossip(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;

    // Light auth: check cookie
    const token = (request as any).cookies?.['auth_token'];
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });

    let ownerId: string;
    try {
        const decoded = request.server.jwt.verify(token) as any;
        ownerId = decoded.id;
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }

    const bubble = await Bubble.findOne({ _id: id, ownerId }).lean();
    if (!bubble) return reply.code(404).send({ error: 'Bubble not found' });

    // Set SSE headers — bypass Fastify's default serialization
    reply.raw.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    // Send a connected event
    reply.raw.write('event: connected\ndata: {"connected":true}\n\n');

    // Register this client
    gossipEngine.addClient(id, reply);

    // Heartbeat every 15s so proxies don't close the connection
    const heartbeat = setInterval(() => {
        try { reply.raw.write(': heartbeat\n\n'); } catch { /* closed */ }
    }, 15000);

    // Clean up on disconnect
    request.raw.on('close', () => {
        clearInterval(heartbeat);
        gossipEngine.removeClient(id, reply);
    });

    // Do NOT call reply.send() — SSE stays open until client disconnects
}
