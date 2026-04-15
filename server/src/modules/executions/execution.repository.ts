import { ExecutionRun } from '../../infrastructure/database/models/ExecutionRun';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';

export const ExecutionRepository = {
    async findById(id: string) {
        return ExecutionRun.findById(id);
    },

    async find(filter: Record<string, unknown>) {
        return ExecutionRun.find(filter).sort({ createdAt: -1 });
    },

    async create(data: Record<string, unknown>) {
        return ExecutionRun.create(data);
    },

    async findAgentById(id: string) {
        return AgentDefinition.findById(id);
    },
};
