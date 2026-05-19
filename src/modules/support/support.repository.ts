import { SupportTicket } from '../../infrastructure/database/models/SupportTicket';
import { User } from '../../infrastructure/database/models/User';

export const SupportRepository = {
    async getUserById(id: string) {
        return User.findById(id).lean();
    },
    async createTicket(data: Record<string, unknown>) {
        return SupportTicket.create(data);
    },
    async findTicketsByUser(userId: string) {
        return SupportTicket.find({ userId }).sort({ createdAt: -1 }).lean();
    },
};
