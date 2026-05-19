import { FastifyPluginAsync } from 'fastify';
import { PaymentLinkService } from './payment-link.service';
import { PaymentVerificationService } from './payment-verification.service';
import {
    cookieAuthSecurity,
    standardErrorResponses,
    paymentLinkSchema,
    workspaceHeaderSchema,
} from '../../shared/docs';

/**
 * PaymentLinkController: REST API endpoints for managing and verifying payment links.
 */
export const paymentLinkRoutes: FastifyPluginAsync = async (fastify) => {

    // POST /payments/links/create - Create a new payment link
    fastify.post<{ Body: { chain: string; recipientAddress: string; signerAddress: string; amount: string; asset: string; memo?: string; reference?: string; expiresAt?: string; metadata?: Record<string, string> } }>(
        '/links/create', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Create a payment link',
            description: 'Generates a new multi-chain payment link. Requires a workspace context via `x-workspace-id` header.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['chain'],
                properties: {
                    chain: { type: 'string', enum: ['ckb', 'CKB'], description: 'The blockchain network' },
                    recipientAddress: { type: 'string' },
                    signerAddress: { type: 'string' },
                    signerSecret: { type: 'string' },
                    amount: { type: 'string' },
                    asset: { type: 'string' },
                    memo: { type: 'string' },
                    reference: { type: 'string' },
                    expiresAt: {
                        oneOf: [
                            { type: 'string', format: 'date-time' },
                            { type: 'number', description: 'Unix timestamp in milliseconds' }
                        ]
                    },
                    metadata: { type: 'object', additionalProperties: { type: 'string' } }
                },
                if: {
                    properties: { chain: { enum: ['ckb', 'CKB'] } }
                },
                then: {
                    required: ['recipientAddress', 'signerAddress', 'signerSecret', 'amount', 'asset']
                }
            },
            headers: workspaceHeaderSchema,
            response: {
                201: {
                    description: 'Payment link created',
                    ...paymentLinkSchema,
                },
                ...standardErrorResponses([400, 401, 403, 500])
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
            const statusCode = err.name === 'PaymentLinkError' ? 400 : (err.code || 500);
            return reply.code(typeof statusCode === 'number' ? statusCode : 500).send({ error: err.message });
        }
    });

    // GET /payments/links/list - List workspace payment links
    fastify.get(
        '/links/list', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'List payment links',
            description: 'Returns all payment links for the current workspace.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'List of payment links',
                    type: 'array',
                    items: paymentLinkSchema,
                },
                ...standardErrorResponses([400, 401, 403, 500])
            },
            headers: workspaceHeaderSchema,
        }
    }, async (request, reply) => {
        try {
            const workspaceId = request.headers['x-workspace-id'] as string;
            if (!workspaceId) return reply.code(400).send({ error: 'Missing x-workspace-id header' });

            return await PaymentLinkService.listPaymentLinks(workspaceId);
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // GET /payments/links/i/* - Public resolution (unauthenticated)
    fastify.get<{ Params: { '*': string } }>(
        '/links/i/*', {
        schema: {
            tags: ['Payments'],
            summary: 'Resolve payment link public info',
            description: 'Returns public details of a payment link using its encoded code. Does not require authentication.',
            params: {
                type: 'object',
                required: ['*'],
                properties: { '*': { type: 'string', description: 'The encoded payment link code' } }
            },
            response: {
                200: {
                    description: 'Payment link details',
                    ...paymentLinkSchema,
                },
                ...standardErrorResponses([404, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const code = request.params['*'];
            const link = await PaymentLinkService.getPaymentLink(code);
            if (!link) return reply.code(404).send({ error: 'Payment link not found' });
            return link;
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // POST /payments/links/verify - Top-level body-driven verification
    fastify.post<{ Body: { id: string; chain: string;[key: string]: any } }>(
        '/links/verify', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Verify payment link (Unified)',
            description: 'Top-level verification endpoint that resolves the link and chain from the body. Remains agnostic of low-level blockchain details.',
            security: [cookieAuthSecurity],
            body: {
                type: 'object',
                required: ['id', 'chain'],
                properties: {
                    id: { type: 'string', description: 'The payment link ID or code' },
                    chain: { type: 'string', description: 'The blockchain network' },
                },
                additionalProperties: true,
            },
            response: {
                200: {
                    description: 'Verification result',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        verificationData: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([400, 401, 404, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const result = await PaymentVerificationService.verifyPayment(undefined, request.body);
            if (!result.success) return reply.code(400).send(result);
            return result;
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // POST /payments/links/verify/* - Path-driven verification (supports encoding)
    fastify.post<{ Params: { '*': string }; Body: Record<string, any> }>(
        '/links/verify/*', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Verify on-chain payment',
            description: 'Checks the blockchain for the provided transaction hash and matches it against the payment link requirements.',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                required: ['*'],
                properties: { '*': { type: 'string', description: 'The payment link ID or code' } }
            },
            body: {
                type: 'object',
                description: 'Polymorphic verification payload. Requirements vary by chain.',
                additionalProperties: true,
            },
            response: {
                200: {
                    description: 'Verification result',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        verificationData: { type: 'object', additionalProperties: true },
                    },
                },
                ...standardErrorResponses([400, 401, 404, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const result = await PaymentVerificationService.verifyPayment(request.params['*'], request.body);
            if (!result.success) return reply.code(400).send(result);
            return reply.send(result);
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // POST /payments/links/cancel/* - Cancel a payment link
    fastify.post<{ Params: { '*': string } }>(
        '/links/cancel/*', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Cancel payment link',
            description: 'Immediately deactivates the payment link, preventing further verification attempts.',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                required: ['*'],
                properties: { '*': { type: 'string', description: 'The payment link ID or code' } }
            },
            response: {
                200: {
                    description: 'Payment link cancelled',
                    ...paymentLinkSchema,
                },
                ...standardErrorResponses([401, 404, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const idOrCode = request.params['*'];
            const link = await PaymentLinkService.cancelPaymentLink(idOrCode);
            if (!link) return reply.code(404).send({ error: 'Payment link not found' });
            return link;
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // GET /payments/links/details/* - Get a specific payment link (authenticated dashboard lookup)
    fastify.get<{ Params: { '*': string } }>(
        '/links/details/*', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['Payments'],
            summary: 'Get payment link details',
            description: 'Returns the full details and current status of a specific payment link. Supports both MongoDB ID and encoded Link code.',
            security: [cookieAuthSecurity],
            params: {
                type: 'object',
                required: ['*'],
                properties: { '*': { type: 'string', description: 'Internal ID or encoded Link code' } }
            },
            response: {
                200: {
                    description: 'Payment link details',
                    ...paymentLinkSchema,
                },
                ...standardErrorResponses([401, 404, 500])
            }
        }
    }, async (request, reply) => {
        try {
            const idOrCode = request.params['*'];
            const link = await PaymentLinkService.getPaymentLink(idOrCode);
            if (!link) return reply.code(404).send({ error: 'Payment link not found' });
            return link;
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });
};
