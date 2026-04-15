import { ToolRegistry } from '../../infrastructure/database/models/ToolRegistry';

export const ToolRepository = {
    async listActive() {
        return ToolRegistry.find({ isActive: true }).sort({ network: 1, category: 1, name: 1 });
    },
};
