import { apiFetch } from './api-client';

export const executionApi = {
    startExecution: async (agentId: string, initialState: any = {}) => {
        return apiFetch('/executions', {
            method: 'POST',
            body: JSON.stringify({
                agentId,
                initialState,
            }),
        });
    },

    getExecutions: async (agentId?: string) => {
        const query = agentId ? `?agentId=${agentId}` : '';
        return apiFetch(`/executions${query}`);
    },

    getExecutionStatus: async (executionId: string) => {
        return apiFetch(`/executions/${executionId}`);
    },
};
