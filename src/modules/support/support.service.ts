import { SupportRepository } from './support.repository';

export const SupportService = {
    async createTicket(userId: string, subject: string, message: string) {
        if (!subject || !message) throw Object.assign(new Error('subject and message are required'), { code: 400 });
        const user = await SupportRepository.getUserById(userId);
        if (!user) throw Object.assign(new Error('User not found'), { code: 404 });
        return SupportRepository.createTicket({
            userId,
            userEmail: (user as any).email ?? '',
            userName: (user as any).name ?? (user as any).username ?? 'Unknown',
            subject,
            message,
        });
    },

    async listTickets(userId: string) {
        return SupportRepository.findTicketsByUser(userId);
    },
};
