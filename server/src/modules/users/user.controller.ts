import { FastifyInstance } from 'fastify';
import { UserService } from './user.service';

export async function userController(fastify: FastifyInstance) {
    // ── Notifications ─────────────────────────────────────────────────────────
    fastify.get('/notifications', { onRequest: [fastify.authenticate] }, async (request) => {
        return UserService.getNotifications(request.user.id);
    });

    fastify.put<{ Body: { telegram?: boolean; dailySummaries?: boolean; email?: boolean } }>(
        '/notifications', { onRequest: [fastify.authenticate] },
        async (request) => {
            return UserService.updateNotifications(request.user.id, request.body);
        }
    );

    // ── Payment methods ───────────────────────────────────────────────────────
    fastify.get('/payment-methods', { onRequest: [fastify.authenticate] }, async (request) => {
        return UserService.getPaymentMethods(request.user.id);
    });

    fastify.put<{ Body: { stripe?: { enabled: boolean }; crypto?: Array<{ label: string; network: string; walletAddress: string; asset: string }> } }>(
        '/payment-methods', { onRequest: [fastify.authenticate] },
        async (request) => {
            return UserService.updatePaymentMethods(request.user.id, request.body.stripe, request.body.crypto);
        }
    );

    // ── API keys ──────────────────────────────────────────────────────────────
    fastify.get('/api-keys', { onRequest: [fastify.authenticate] }, async (request) => {
        return UserService.getApiKeys(request.user.id);
    });

    fastify.put<{ Body: { gemini?: string; openai?: string; openaiBaseUrl?: string; openaiModel?: string; ollamaBaseUrl?: string; ollamaModel?: string } }>(
        '/api-keys', { onRequest: [fastify.authenticate] },
        async (request) => {
            return UserService.updateApiKeys(request.user.id, request.body);
        }
    );
}
