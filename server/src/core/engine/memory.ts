import { SessionMemory } from '../../infrastructure/database/models/SessionMemory';
import { Types } from 'mongoose';

export class MemoryService {
    static async getSession(sessionId: string, agentId: string, userId: string) {
        let session = await SessionMemory.findOne({ sessionId });
        if (!session) {
            session = new SessionMemory({
                sessionId,
                agentId: new Types.ObjectId(agentId),
                userId: new Types.ObjectId(userId),
                messages: [],
                context: {}
            });
            await session.save();
        }
        return session;
    }

    static async addMessage(sessionId: string, role: 'system' | 'user' | 'assistant' | 'tool', content: string) {
        return await SessionMemory.findOneAndUpdate(
            { sessionId },
            { $push: { messages: { role, content, timestamp: new Date() } } },
            { new: true }
        );
    }

    static async updateContext(sessionId: string, newContext: any) {
        const session = await SessionMemory.findOne({ sessionId });
        if (!session) return null;

        session.context = { ...session.context, ...newContext };
        session.markModified('context');
        return await session.save();
    }

    static async getRecentMessages(sessionId: string, limit: number = 20) {
        const session = await SessionMemory.findOne({ sessionId });
        if (!session) return [];
        return session.messages.slice(-limit);
    }
}
