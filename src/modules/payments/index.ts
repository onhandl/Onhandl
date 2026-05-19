import { FastifyInstance } from 'fastify';
import { paymentRoutes as routes } from './payment.controller';
import { paymentLinkRoutes } from './payment-link.controller';
import { PaymentLinkService as CorePaymentLinkService } from '../../core/payments/payment-links/payment-link.service';
import { CkbPaymentLinkAdapter } from '../../infrastructure/blockchain/ckb/ckb-payment-link.adapter';

export async function paymentRoutes(fastify: FastifyInstance) {
    // Register chain adapters
    CorePaymentLinkService.registerAdapter(new CkbPaymentLinkAdapter());

    await fastify.register(routes);
    await fastify.register(paymentLinkRoutes);
}
