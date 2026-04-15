import { FastifyPluginAsync } from 'fastify';
import { PaymentService, CRYPTO_NETWORKS } from './payment.service';
import { ENV } from '../../shared/config/environments';
import {
    cookieAuthSecurity, idParamSchema, purchaseIdParamSchema, standardErrorResponses,
} from '../../shared/docs';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {

    // ── Stripe Connect ────────────────────────────────────────────────────────
    fastify.get('/stripe/connect-url', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Get Stripe Connect onboarding URL',
            description: 'Returns a Stripe Connect onboarding URL so the creator can connect their Stripe account to receive marketplace payments.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Stripe Connect URL', type: 'object', properties: { url: { type: 'string' } } },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try { return PaymentService.getStripeConnectUrl(request.user.id); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.get<{ Querystring: { code: string; state: string } }>('/stripe/callback', {
        schema: {
            tags: ['Payments'],
            summary: 'Stripe Connect OAuth callback',
            description: 'Handles the OAuth redirect from Stripe after the creator completes Connect onboarding. Redirects to the payment settings page.',
            querystring: {
                type: 'object',
                required: ['code', 'state'],
                properties: {
                    code: { type: 'string', description: 'Authorization code from Stripe OAuth' },
                    state: { type: 'string', description: 'User ID passed as OAuth state' },
                },
            },
            response: {
                302: { description: 'Redirect to settings page', type: 'string' },
                ...standardErrorResponses([400]),
            },
        },
    }, async (request, reply) => {
        const { code, state: userId } = request.query;
        if (!code) return reply.code(400).send({ error: 'Missing code' });
        await PaymentService.handleStripeCallback(code, userId);
        return reply.redirect(`${ENV.APP_URL}/settings/payments?stripe=connected`);
    });

    fastify.get('/stripe/status', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Get Stripe Connect status',
            description: 'Returns the current Stripe Connect account status for the authenticated user.',
            security: [cookieAuthSecurity],
            response: {
                200: { description: 'Stripe status', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401]),
            },
        },
    }, async (request) => PaymentService.getStripeStatus(request.user.id));

    // ── Stripe Checkout ───────────────────────────────────────────────────────
    fastify.post<{ Params: { agentId: string } }>('/stripe/checkout/:agentId', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Create Stripe checkout session',
            description: 'Creates a Stripe checkout session for purchasing a paid marketplace agent.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            response: {
                200: { description: 'Checkout session URL', type: 'object', properties: { url: { type: 'string' } } },
                ...standardErrorResponses([401, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try { return PaymentService.createStripeCheckoutSession(request.user.id, request.params.agentId); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.post('/stripe/webhook', {
        config: { rawBody: true },
        schema: {
            tags: ['Payments'],
            summary: 'Stripe webhook handler',
            description: 'Receives and verifies Stripe webhook events. Validates the `Stripe-Signature` header. This endpoint must not require cookie auth.',
            response: {
                200: { description: 'Event processed', type: 'object', additionalProperties: true },
                ...standardErrorResponses([400]),
            },
        },
    }, async (request, reply) => {
        const sig = request.headers['stripe-signature'] as string;
        try { return await PaymentService.handleStripeWebhook((request as any).rawBody || JSON.stringify(request.body), sig); }
        catch (e: any) { return reply.code(e.code || 400).send({ error: e.message }); }
    });

    // ── Crypto ────────────────────────────────────────────────────────────────
    fastify.post<{ Params: { agentId: string }; Body: { txHash: string; network: string } }>(
        '/crypto/purchase/:agentId', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Initiate crypto purchase',
            description: 'Records a crypto payment for a marketplace agent by providing a blockchain transaction hash.',
            security: [cookieAuthSecurity],
            params: idParamSchema('Agent ID'),
            body: {
                type: 'object',
                required: ['txHash', 'network'],
                properties: {
                    txHash: { type: 'string', description: 'On-chain transaction hash' },
                    network: { type: 'string', description: 'Blockchain network (e.g. ckb, ethereum)' },
                },
            },
            response: {
                200: { description: 'Purchase initiated (pending verification)', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    },
        async (request, reply) => {
            try { return PaymentService.initiateCryptoPurchase(request.user.id, request.params.agentId, request.body.txHash, request.body.network); }
            catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
        }
    );

    fastify.post<{ Params: { purchaseId: string } }>('/crypto/verify/:purchaseId', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Verify crypto purchase',
            description: 'Verifies an on-chain transaction for a pending crypto purchase. Grants access to the agent if verified.',
            security: [cookieAuthSecurity],
            params: purchaseIdParamSchema(),
            response: {
                200: { description: 'Verification result', type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 500]),
            },
        },
    }, async (request, reply) => {
        try { return PaymentService.verifyCryptoPurchase(request.params.purchaseId); }
        catch (e: any) { return reply.code(e.code || 500).send({ error: e.message }); }
    });

    fastify.get('/crypto/networks', {
        schema: {
            tags: ['Payments'],
            summary: 'List supported crypto networks',
            description: 'Returns all supported blockchain networks available for crypto payments.',
            response: {
                200: {
                    description: 'Supported networks',
                    type: 'array',
                    items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                },
            },
        },
    }, async () => CRYPTO_NETWORKS);
};
