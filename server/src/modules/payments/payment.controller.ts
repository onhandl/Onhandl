import { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { User } from '../../infrastructure/database/models/User';
import { ENV } from '../../shared/config/environments';
import { verifyAuthCookie } from '../../api/middlewares/auth';

// Lazily initialise Stripe so the server starts even if key is missing
function getStripe(): Stripe {
    if (!ENV.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    return new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' });
}

// Supported blockchains / assets for crypto payments
const CRYPTO_NETWORKS: Record<string, string[]> = {
    Ethereum: ['ETH', 'USDT', 'USDC'],
    CKB: ['CKB'],
    Solana: ['SOL', 'USDC'],
    Polygon: ['MATIC', 'USDT'],
    'BNB Chain': ['BNB', 'USDT'],
};

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {

    // ── Stripe Connect ────────────────────────────────────────────────────────

    /** Return the Stripe Connect OAuth URL so users can connect their account. */
    fastify.get('/stripe/connect-url', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        if (!ENV.STRIPE_CLIENT_ID) {
            return reply.code(503).send({ error: 'Stripe Connect is not configured on this server' });
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: ENV.STRIPE_CLIENT_ID,
            scope: 'read_write',
            redirect_uri: ENV.STRIPE_REDIRECT_URI,
            state: decoded.id, // pass userId so we can link on callback
        });

        return { url: `https://connect.stripe.com/oauth/authorize?${params}` };
    });

    /** OAuth callback — exchange code for access token and save stripeAccountId. */
    fastify.get<{ Querystring: { code: string; state: string } }>(
        '/stripe/callback',
        async (request, reply) => {
            const { code, state: userId } = request.query;
            if (!code) return reply.code(400).send({ error: 'Missing code' });

            const stripe = getStripe();
            const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });
            const stripeAccountId = response.stripe_user_id;

            await User.findByIdAndUpdate(userId, { stripeAccountId });

            // Redirect back to payment settings page
            return reply.redirect(`${ENV.APP_URL}/settings/payments?stripe=connected`);
        }
    );

    /** Get current Stripe Connect status for the logged-in user. */
    fastify.get('/stripe/status', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const user = await User.findById(decoded.id).select('stripeAccountId');
        return { connected: !!user?.stripeAccountId, stripeAccountId: user?.stripeAccountId || null };
    });

    // ── Stripe Checkout ───────────────────────────────────────────────────────

    /** Create a Stripe Checkout Session for purchasing a paid agent. */
    fastify.post<{ Params: { agentId: string } }>(
        '/stripe/checkout/:agentId',
        async (request, reply) => {
            const decoded = verifyAuthCookie(fastify, request.cookies, reply);
            if (!decoded) return;

            const { agentId } = request.params;
            const agent = await AgentDefinition.findById(agentId);
            if (!agent) return reply.code(404).send({ error: 'Agent not found' });
            if (!agent.marketplace?.published) return reply.code(400).send({ error: 'Agent not on marketplace' });
            if (agent.marketplace.pricing.type !== 'paid') return reply.code(400).send({ error: 'Agent is free' });

            const seller = await User.findById(agent.ownerId);
            if (!seller?.stripeAccountId) {
                return reply.code(400).send({ error: 'Seller has not connected a Stripe account' });
            }

            const stripe = getStripe();
            const amountCents = Math.round(agent.marketplace.pricing.price * 100);

            const session = await stripe.checkout.sessions.create(
                {
                    mode: 'payment',
                    line_items: [
                        {
                            price_data: {
                                currency: agent.marketplace.pricing.currency.toLowerCase(),
                                product_data: { name: agent.name, description: agent.description },
                                unit_amount: amountCents,
                            },
                            quantity: 1,
                        },
                    ],
                    success_url: `${ENV.APP_URL}/marketplace/agent/${agentId}?purchase=success`,
                    cancel_url: `${ENV.APP_URL}/marketplace/agent/${agentId}?purchase=cancelled`,
                    metadata: { agentId, buyerId: String(decoded.id) },
                },
                { stripeAccount: seller.stripeAccountId }
            );

            // Create a pending Purchase record
            await Purchase.create({
                agentId,
                buyerId: decoded.id,
                sellerId: agent.ownerId,
                paymentMethod: 'stripe',
                amount: agent.marketplace.pricing.price,
                currency: agent.marketplace.pricing.currency,
                status: 'pending',
                stripeSessionId: session.id,
            });

            return { sessionUrl: session.url };
        }
    );

    /** Stripe webhook — confirms payment and marks purchase as confirmed. */
    fastify.post('/stripe/webhook', {
        config: { rawBody: true },
    }, async (request, reply) => {
        const sig = request.headers['stripe-signature'] as string;
        if (!sig || !ENV.STRIPE_WEBHOOK_SECRET) return reply.code(400).send({ error: 'Webhook not configured' });

        let event: Stripe.Event;
        try {
            const stripe = getStripe();
            event = stripe.webhooks.constructEvent(
                (request as any).rawBody || JSON.stringify(request.body),
                sig,
                ENV.STRIPE_WEBHOOK_SECRET
            );
        } catch {
            return reply.code(400).send({ error: 'Invalid webhook signature' });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            await Purchase.findOneAndUpdate(
                { stripeSessionId: session.id },
                { status: 'confirmed' }
            );
            // Increment purchase count on the agent
            if (session.metadata?.agentId) {
                await AgentDefinition.findByIdAndUpdate(session.metadata.agentId, {
                    $inc: { 'marketplace.stats.purchases': 1 },
                });
            }
        }

        return { received: true };
    });

    // ── Crypto Payments ───────────────────────────────────────────────────────

    /** Initiate a crypto purchase — records pending Purchase with tx hash submitted by buyer. */
    fastify.post<{
        Params: { agentId: string };
        Body: { txHash: string; network: string };
    }>('/crypto/purchase/:agentId', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const { agentId } = request.params;
        const { txHash, network } = request.body;

        const agent = await AgentDefinition.findById(agentId);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        if (!agent.marketplace?.paymentMethods?.crypto?.enabled) {
            return reply.code(400).send({ error: 'Crypto payments not enabled for this agent' });
        }

        const purchase = await Purchase.create({
            agentId,
            buyerId: decoded.id,
            sellerId: agent.ownerId,
            paymentMethod: 'crypto',
            amount: agent.marketplace.paymentMethods.crypto.amount,
            currency: agent.marketplace.paymentMethods.crypto.asset,
            status: 'pending',
            cryptoTxHash: txHash,
            network,
        });

        // TODO: trigger async verification via Blockscout MCP
        // e.g. verifyTxOnChain(txHash, network, agent.marketplace.paymentMethods.crypto)

        return { purchase, message: 'Transaction submitted — pending on-chain verification' };
    });

    /** Verify a crypto transaction on-chain (Blockscout). */
    fastify.post<{
        Params: { purchaseId: string };
    }>('/crypto/verify/:purchaseId', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;

        const purchase = await Purchase.findById(request.params.purchaseId);
        if (!purchase) return reply.code(404).send({ error: 'Purchase not found' });
        if (!purchase.cryptoTxHash) return reply.code(400).send({ error: 'No transaction hash on record' });

        // TODO: Use Blockscout MCP to verify:
        //   const result = await blockscoutMcp.getTransaction(purchase.cryptoTxHash, purchase.network)
        //   if (result.status === 'success' && result.value >= expectedAmount) { confirmed = true }
        //
        // For now return pending until MCP is integrated
        return {
            status: purchase.status,
            txHash: purchase.cryptoTxHash,
            network: purchase.network,
            message: 'On-chain verification via Blockscout MCP — integrate to confirm automatically',
        };
    });

    /** Supported crypto networks and assets */
    fastify.get('/crypto/networks', async () => CRYPTO_NETWORKS);
};
