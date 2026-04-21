import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { User } from '../../infrastructure/database/models/User';

export const PaymentRepository = {
    async findAgentById(id: string) {
        return AgentDefinition.findById(id);
    },
    async findUserById(id: string) {
        return User.findById(id);
    },
};
