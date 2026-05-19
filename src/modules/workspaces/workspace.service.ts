import { WorkspaceRepository } from './workspace.repository';

export const WorkspaceService = {
    async getForUser(userId: string) {
        return WorkspaceRepository.findByOwner(userId);
    },

    async create(userId: string, name: string) {
        if (!name) throw Object.assign(new Error('name is required'), { code: 400 });
        return WorkspaceRepository.create({ name, ownerId: userId });
    },
};
