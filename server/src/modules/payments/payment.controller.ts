import { FastifyPluginAsync } from 'fastify';
import { PaymentService, CRYPTO_NETWORKS } from './payment.service';
import { ENV } from '../../shared/config/environments';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {

    // ── Stripe Connect ────────────────────────────────────────────────────────

    fastify.get('/stripe/connect-url', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try { return PaymentService.getStripeConnectUrl(request.user.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.get<{ Querystring: { code: string; state: string } }>('/stripe/callback', async (request, reply) => {
        const { code, state: userId } = request.query;
        if (!code) return reply.code(400).send({ error: 'Missing code' });
        await PaymentService.handleStripeCallback(code, userId);
        return reply.redirect(`${ENV.APP_URL}/settings/payments?stripe=connected`);
    });

    fastify.get('/stripe/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        return PaymentService.getStripeStatus(request.user.id);
    });

    // ── Stripe Checkout ───────────────────────────────────────────────────────

    fastify.post<{ Params: { agentId: string } }>(
        '/stripe/checkout/:agentId', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return PaymentService.createStripeCheckoutSession(request.user.id, request.params.agentId); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.post('/stripe/webhook', { config: { rawBody: true } }, async (request, reply) => {
        const sig = request.headers['stripe-signature'] as string;
        try {
            return await PaymentService.handleStripeWebhook(
                (request as any).rawBody || JSON.stringify(request.body), sig
            );
        } catch (e: any) { return reply.code(e.code || 400).send({ error: e.message }); }
    });

    // ── Crypto ────────────────────────────────────────────────────────────────

    fastify.post<{ Params: { agentId: string }; Body: { txHash: string; network: string } }>(
        '/crypto/purchase/:agentId', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return PaymentService.initiateCryptoPurchase(request.user.id, request.params.agentId, request.body.txHash, request.body.network); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.post<{ Params: { purchaseId: string } }>(
        '/crypto/verify/:purchaseId', { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try { return PaymentService.verifyCryptoPurchase(request.params.purchaseId); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.get('/crypto/networks', async () => CRYPTO_NETWORKS);
};
