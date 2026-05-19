import mongoose from 'mongoose';
import { User } from '../../../infrastructure/database/models/User';
import { Workspace } from '../../../infrastructure/database/models/Workspace';
import { FinancialAgent } from '../../../infrastructure/database/models/FinancialAgent';

export const TelegramEventNotifierRepository = {
    async findAgentName(agentId?: string) {
        if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) return null;
        const agent = await FinancialAgent.findById(agentId).select('name').lean();
        return agent?.name || null;
    },

    async findTargetUsers(event: { workspaceId?: string; agentId?: string }) {
        const userIds = new Set<string>();

        if (event.workspaceId && mongoose.Types.ObjectId.isValid(event.workspaceId)) {
            const workspace = await Workspace.findById(event.workspaceId).select('ownerId members').lean();
            if (workspace?.ownerId) userIds.add(String(workspace.ownerId));
            for (const member of workspace?.members || []) {
                userIds.add(String(member));
            }
        }

        if (event.agentId && mongoose.Types.ObjectId.isValid(event.agentId)) {
            const agent = await FinancialAgent.findById(event.agentId).select('workspaceId').lean();
            if (agent?.workspaceId) {
                const workspace = await Workspace.findById(agent.workspaceId).select('ownerId members').lean();
                if (workspace?.ownerId) userIds.add(String(workspace.ownerId));
                for (const member of workspace?.members || []) {
                    userIds.add(String(member));
                }
            }
        }

        if (userIds.size === 0) return [];

        return User.find({
            _id: { $in: Array.from(userIds) },
            'telegram.chatId': { $exists: true, $ne: '' },
            'notifications.telegram': true,
            $or: [
                { 'telegram.permissions.notifications': true },
                { 'telegram.permissions.notifications': { $exists: false } },
            ],
        })
            .select('_id username telegram notifications')
            .lean();
    },
};

