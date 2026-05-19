import { PaymentLink, IPaymentLink } from '../../infrastructure/database/models/PaymentLink';
import mongoose from 'mongoose';

/**
 * PaymentLinkRepository: Data access layer for PaymentLink model.
 */
export const PaymentLinkRepository = {
    async create(data: Partial<IPaymentLink>): Promise<IPaymentLink> {
        return await PaymentLink.create(data);
    },

    async findById(id: string): Promise<IPaymentLink | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await PaymentLink.findById(id);
    },

    async findByReference(reference: string): Promise<IPaymentLink | null> {
        return await PaymentLink.findOne({ reference });
    },

    async findByLink(link: string): Promise<IPaymentLink | null> {
        return await PaymentLink.findOne({ link });
    },

    async listByWorkspace(workspaceId: string): Promise<IPaymentLink[]> {
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) return [];
        return await PaymentLink.find({ workspaceId }).sort({ createdAt: -1 });
    },

    async updateStatus(id: string, status: IPaymentLink['status'], update: Partial<IPaymentLink> = {}): Promise<IPaymentLink | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await PaymentLink.findByIdAndUpdate(
            id,
            { status, ...update },
            { new: true }
        );
    },

    async markPaid(id: string, data: {
        txHash: string;
        payerAddress: string;
        paidAmount: string;
        fulfilledAt: Date;
        chain: string;
        verificationData: Record<string, unknown>;
    }): Promise<IPaymentLink | null> {
        return this.updateStatus(id, 'paid', data as Partial<IPaymentLink>);
    },

    async markExpired(id: string): Promise<IPaymentLink | null> {
        return this.updateStatus(id, 'expired');
    },

    async cancel(id: string): Promise<IPaymentLink | null> {
        return this.updateStatus(id, 'cancelled');
    }
};
