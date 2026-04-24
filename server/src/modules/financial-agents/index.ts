import { FastifyPluginAsync } from 'fastify';
import { financialAgentController } from './financial-controllers/financial-agent.controller';
import { createFinancialRuntimeWiring } from './financial-runtime.wiring';

let runtimeWired = false;

export const financialAgentRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(financialAgentController);

    if (!runtimeWired) {
        createFinancialRuntimeWiring();
        runtimeWired = true;
    }
};
