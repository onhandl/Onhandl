import { FastifyPluginAsync } from 'fastify';
import { PaymentLinkService } from './payment-link.service';
import { PaymentVerificationService } from './payment-verification.service';
import { cookieAuthSecurity, standardErrorResponses } from '../../shared/docs';

/**
 * PaymentLinkController: REST API endpoints for managing and verifying payment links.
 */
export const paymentLinkRoutes: FastifyPluginAsync = async (fastify) => {

    // POST /payments/links - Create a new payment link
    fastify.post<{ Body: { chain: string; recipientAddress: string; signerAddress: string; amount: string; asset: string; memo?: string; reference?: string; expiresAt?: string; metadata?: Record<string, string> } }>(
        '/links', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Create a payment link',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['chain', 'recipientAddress', 'signerAddress', 'amount', 'asset'],
                properties: {
                    chain: { type: 'string' },
                    recipientAddress: { type: 'string' },
                    signerAddress: { type: 'string' },
                    amount: { type: 'string' },
                    asset: { type: 'string' },
                    memo: { type: 'string' },
                    reference: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    metadata: { type: 'object', additionalProperties: { type: 'string' } }
                }
            },
            response: {
                201: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 403, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });

            const link = await PaymentLinkService.createPaymentLink({
                ...request.body,
                workspaceId,
                createdBy: request.user.id,
                expiresAt: request.body.expiresAt ? new Date(request.body.expiresAt) : undefined
            });

            return reply.code(201).send(link);
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // GET /payments/links - List workspace payment links
    fastify.get(
        '/links', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'List payment links',
            security: [cookieAuthSecurity],
            response: {
                200: { type: 'array', items: { type: 'object', additionalProperties: true } },
                ...standardErrorResponses([401, 403, 500])
            }
        }
    }, async (request, reply) => {
        const workspaceId = request.headers['x-workspace-id'] as string;
        if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });

        return await PaymentLinkService.listPaymentLinks(workspaceId);
    });

    // GET /payments/links/:id - Get a specific payment link
    fastify.get<{ Params: { id: string } }>(
        '/links/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Get payment link details',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } }
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 404, 500])
            }
        }
    }, async (request, reply) => {
        const link = await PaymentLinkService.getPaymentLink(request.params.id);
        if (!link) return reply.code(404).send({ error: 'Payment link not found' });
        return link;
    });

    // POST /payments/links/:id/verify - Verify on-chain payment
    fastify.post<{ Params: { id: string }; Body: { txHash: string } }>(
        '/links/:id/verify', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Verify on-chain payment',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } }
            },
            body: {
                type: 'object',
                required: ['txHash'],
                properties: { txHash: { type: 'string' } }
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                ...standardErrorResponses([401, 400, 404, 500])
            }
        }
    }, async (request, reply) => {
        const result = await PaymentVerificationService.verifyPayment(request.params.id, request.body.txHash);
        if (!result.success) return reply.code(400).send(result);
        return result;
    });

    // POST /payments/links/:id/cancel - Cancel a payment link
    fastify.post<{ Params: { id: string } }>(
        '/links/:id/cancel', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Cancel payment link',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                properties: { id: { type: 'string' } }
            },
            response: {
                200: { type: 'object', additionalProperties: true },
                ...standardErrorResponses([401, 404, 500])
            }
        }
    }, async (request, reply) => {
        const link = await PaymentLinkService.cancelPaymentLink(request.params.id);
        if (!link) return reply.code(404).send({ error: 'Payment link not found' });
        return link;
    });
};
