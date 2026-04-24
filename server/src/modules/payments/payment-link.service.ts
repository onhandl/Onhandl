import { PaymentLinkService as CorePaymentLinkService } from '../../core/payments/payment-links/payment-link.service';
import { PaymentLinkRepository } from './payment-link.repository';
import { IPaymentLink } from '../../infrastructure/database/models/PaymentLink';
import { eventBus } from '../../infrastructure/events/eventBus';
import mongoose from 'mongoose';

interface CreatePaymentLinkDTO {
    workspaceId: string;
    agentId?: string;
    createdBy: string;
    chain: string;
    recipientAddress: string;
    signerAddress: string;
    amount: string;
    asset: string;
    memo?: string;
    reference?: string;
    expiresAt?: Date;
    signerSecret?: string;
    metadata?: Record<string, string>;
}

/**
 * PaymentLinkModuleService: Application layer service for managing payment links.
 */
export const PaymentLinkService = {
    /**
     * Creates a new payment link, persists it, and emits an event.
     */
    async createPaymentLink(dto: CreatePaymentLinkDTO): Promise<IPaymentLink> {
        // 1. Generate the encoded payment link using core service
        const link = await CorePaymentLinkService.generatePaymentLink({
            chain: dto.chain,
            recipientAddress: dto.recipientAddress,
            signerAddress: dto.signerAddress,
            amount: dto.amount,
            asset: dto.asset,
            memo: dto.memo,
            reference: dto.reference,
            expiresAt: dto.expiresAt?.getTime(),
            metadata: dto.metadata
        }, dto.signerSecret || "" /* Use provided secret or fall back to empty which is caught by error handler */);

        // 2. Persist to database
        const paymentLink = await PaymentLinkRepository.create({
            workspaceId: new mongoose.Types.ObjectId(dto.workspaceId),
            agentId: dto.agentId ? new mongoose.Types.ObjectId(dto.agentId) : undefined,
            createdBy: new mongoose.Types.ObjectId(dto.createdBy),
            chain: dto.chain,
            asset: dto.asset,
            recipientAddress: dto.recipientAddress,
            signerAddress: dto.signerAddress,
            amount: dto.amount,
            reference: dto.reference,
            memo: dto.memo,
            metadata: dto.metadata,
            link: link,
            status: 'active',
            expiresAt: dto.expiresAt
        });

        // 3. Emit event
        eventBus.emit('PAYMENT_LINK_CREATED', {
            paymentLinkId: paymentLink._id,
            workspaceId: paymentLink.workspaceId,
            createdBy: paymentLink.createdBy
        });

        return paymentLink;
    },

    async getPaymentLink(id: string): Promise<IPaymentLink | null> {
        // 1. Check if it's a valid link code (starts with payl:)
        if (id.startsWith('payl:')) {
            return PaymentLinkRepository.findByLink(id);
        }

        // 2. Otherwise assume it's a MongoDB ID
        return PaymentLinkRepository.findById(id);
    },

    async listPaymentLinks(workspaceId: string): Promise<IPaymentLink[]> {
        return PaymentLinkRepository.listByWorkspace(workspaceId);
    },

    async cancelPaymentLink(id: string): Promise<IPaymentLink | null> {
        return PaymentLinkRepository.cancel(id);
    },

    async expirePaymentLink(id: string): Promise<IPaymentLink | null> {
        return PaymentLinkRepository.markExpired(id);
    }
};
