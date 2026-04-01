import { FastifyPluginAsync } from 'fastify';
import { WaitlistEntry } from '../models/WaitlistEntry';
import { User } from '../models/User';

export const waitlistRoutes: FastifyPluginAsync = async (fastify) => {

    // ── Join waitlist (public) ────────────────────────────────────────────────
    fastify.post<{ Body: { name: string; email: string; source?: string } }>(
        '/waitlist/join',
        async (request, reply) => {
            const { name, email, source } = request.body;

            if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });
            if (!email?.trim()) return reply.code(400).send({ error: 'Email is required' });

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return reply.code(400).send({ error: 'Invalid email address' });

            const existing = await WaitlistEntry.findOne({ email: email.toLowerCase().trim() });
            if (existing) return reply.code(409).send({ error: 'This email is already on the waitlist' });

            await WaitlistEntry.create({ name: name.trim(), email: email.toLowerCase().trim(), source: source || 'landing' });

            const count = await WaitlistEntry.countDocuments();
            return reply.code(201).send({ success: true, message: "You're on the list!", count });
        }
    );

    // ── Get total waitlist count (public — for the progress bar) ─────────────
    fastify.get('/waitlist/count', async (_request, _reply) => {
        const count = await WaitlistEntry.countDocuments();
        return { count };
    });

    // ── List all entries (admin only) ─────────────────────────────────────────
    fastify.get<{ Querystring: { page?: string; limit?: string; search?: string } }>(
        '/waitlist',
        async (request, reply) => {
            const token = request.cookies['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });

            let decoded: any;
            try { decoded = fastify.jwt.verify(token); } catch {
                return reply.code(401).send({ error: 'Invalid token' });
            }

            // Only admin users (isAdmin flag checked via User model)
            // User imported at top
            const user = await User.findById(decoded.id).select('isAdmin');
            if (!user?.isAdmin) return reply.code(403).send({ error: 'Admin access required' });

            const { page = '1', limit = '50', search } = request.query;
            const filter: any = {};
            if (search) {
                filter.$or = [
                    { name:  { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [entries, total] = await Promise.all([
                WaitlistEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
                WaitlistEntry.countDocuments(filter),
            ]);

            return { entries, total, page: parseInt(page), limit: parseInt(limit) };
        }
    );

    // ── Delete an entry (admin only) ─────────────────────────────────────────
    fastify.delete<{ Params: { id: string } }>(
        '/waitlist/:id',
        async (request, reply) => {
            const token = request.cookies['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });
            let decoded: any;
            try { decoded = fastify.jwt.verify(token); } catch {
                return reply.code(401).send({ error: 'Invalid token' });
            }
            // User imported at top
            const user = await User.findById(decoded.id).select('isAdmin');
            if (!user?.isAdmin) return reply.code(403).send({ error: 'Admin access required' });

            await WaitlistEntry.findByIdAndDelete(request.params.id);
            return { success: true };
        }
    );
};
