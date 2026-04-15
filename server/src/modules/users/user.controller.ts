import { FastifyInstance } from 'fastify';
import { User } from '../../infrastructure/database/models/User';
import { verifyAuthCookie } from '../../api/middlewares/auth';

function mask(key?: string): string | null {
    if (!key) return null;
    return `${key.slice(0, 4)}${'•'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`;
}

function authGuard(fastify: any, cookies: any): { id: string } | null {
    const token = cookies['auth_token'];
    if (!token) return null;
    try { return fastify.jwt.verify(token); } catch { return null; }
}

export async function userController(fastify: FastifyInstance) {
    // ── Notifications ─────────────────────────────────────────────────────────
    fastify.get('/notifications', async (request: any, reply) => {
        const decoded = authGuard(fastify, request.cookies);
        if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
        const user = await User.findById(decoded.id).select('notifications');
        return user?.notifications ?? { telegram: false, dailySummaries: false, email: true };
    });

    fastify.put<{ Body: { telegram?: boolean; dailySummaries?: boolean; email?: boolean } }>(
        '/notifications',
        async (request: any, reply) => {
            const decoded = authGuard(fastify, request.cookies);
            if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
            const { telegram, dailySummaries, email } = request.body;
            const update: any = {};
            if (telegram !== undefined) update['notifications.telegram'] = telegram;
            if (dailySummaries !== undefined) update['notifications.dailySummaries'] = dailySummaries;
            if (email !== undefined) update['notifications.email'] = email;
            await User.findByIdAndUpdate(decoded.id, { $set: update });
            return { success: true };
        }
    );

    // ── Saved payment methods ─────────────────────────────────────────────────
    fastify.get('/payment-methods', async (request: any, reply) => {
        const decoded = authGuard(fastify, request.cookies);
        if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
        const user = await User.findById(decoded.id).select('savedPaymentMethods stripeAccountId');
        const saved = (user?.savedPaymentMethods as any) || {};
        return {
            stripe: { enabled: !!saved.stripe?.enabled, stripeAccountId: (user as any)?.stripeAccountId || '' },
            crypto: saved.crypto || [],
        };
    });

    fastify.put<{ Body: { stripe?: { enabled: boolean }; crypto?: Array<{ label: string; network: string; walletAddress: string; asset: string }>; } }>(
        '/payment-methods',
        async (request: any, reply) => {
            const decoded = authGuard(fastify, request.cookies);
            if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
            const { stripe, crypto } = request.body;
            const update: any = {};
            if (stripe !== undefined) update['savedPaymentMethods.stripe'] = stripe;
            if (crypto !== undefined) update['savedPaymentMethods.crypto'] = crypto;
            await User.findByIdAndUpdate(decoded.id, { $set: update });
            return { success: true };
        }
    );

    // ── API keys ──────────────────────────────────────────────────────────────
    fastify.get('/api-keys', async (request: any, reply) => {
        const decoded = authGuard(fastify, request.cookies);
        if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
        const user = await User.findById(decoded.id).select('apiKeys');
        const k = (user?.apiKeys as any) || {};
        return {
            gemini: mask(k.gemini), openai: mask(k.openai),
            openaiBaseUrl: k.openaiBaseUrl || '', openaiModel: k.openaiModel || '',
            ollamaBaseUrl: k.ollamaBaseUrl || '', ollamaModel: k.ollamaModel || '',
            hasGemini: !!k.gemini, hasOpenai: !!k.openai, hasOllama: !!(k.ollamaBaseUrl),
        };
    });

    fastify.put<{ Body: { gemini?: string; openai?: string; openaiBaseUrl?: string; openaiModel?: string; ollamaBaseUrl?: string; ollamaModel?: string; } }>(
        '/api-keys',
        async (request: any, reply) => {
            const decoded = authGuard(fastify, request.cookies);
            if (!decoded) return reply.code(401).send({ error: 'Unauthorized' });
            const { gemini, openai, openaiBaseUrl, openaiModel, ollamaBaseUrl, ollamaModel } = request.body;
            const set: any = {};
            if (gemini !== undefined) set['apiKeys.gemini'] = gemini;
            if (openai !== undefined) set['apiKeys.openai'] = openai;
            if (openaiBaseUrl !== undefined) set['apiKeys.openaiBaseUrl'] = openaiBaseUrl;
            if (openaiModel !== undefined) set['apiKeys.openaiModel'] = openaiModel;
            if (ollamaBaseUrl !== undefined) set['apiKeys.ollamaBaseUrl'] = ollamaBaseUrl;
            if (ollamaModel !== undefined) set['apiKeys.ollamaModel'] = ollamaModel;
            await User.findByIdAndUpdate(decoded.id, { $set: set });
            return { success: true };
        }
    );
}
