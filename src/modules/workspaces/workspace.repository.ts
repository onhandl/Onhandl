import { Workspace } from '../../infrastructure/database/models/Workspace';

export const WorkspaceRepository = {
    async findAll() {
        return Workspace.find({}).populate('ownerId');
    },
    async findByOwner(ownerId: string) {
        return Workspace.find({ ownerId });
    },
    async create(data: { name: string; ownerId: string }) {
        const workspace = new Workspace(data);
        await workspace.save();
        return workspace;
    },
};
