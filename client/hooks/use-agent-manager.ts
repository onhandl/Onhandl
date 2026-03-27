'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui';
import { useFlow } from '@/contexts/FlowContext';
import { agentApi } from '@/api';

export const useAgentManager = () => {
    const { nodes, edges, reactFlowInstance, setNodes, setEdges } = useFlow();
    const { toast } = useToast();

    const saveAgent = useCallback(async (name: string, persona?: string, graph?: { nodes: any[]; edges: any[] }, description?: string, isDraft: boolean = true) => {
        const flow = graph || (reactFlowInstance ? reactFlowInstance.toObject() : { nodes: [], edges: [] });
        try {
            const response = await agentApi.saveAgent(name, {
                nodes: flow.nodes,
                edges: flow.edges,
            }, persona, description, isDraft);
            return response;
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to save agent.',
                variant: 'destructive',
            });
            throw err;
        }
    }, [reactFlowInstance, toast]);

    const updateAgent = useCallback(async (id: string, updates: { name?: string; description?: string; graph?: { nodes: any[]; edges: any[] }; identities?: any; isDraft?: boolean }) => {
        try {
            const response = await agentApi.updateAgent(id, updates);
            return response;
        } catch (err: any) {
            console.error('Update agent error:', err);
            throw err;
        }
    }, []);

    const listAgents = useCallback(async () => {
        try {
            const data = await agentApi.loadAgents();
            return Array.isArray(data) ? data : [];
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to list agents.',
                variant: 'destructive',
            });
            return [];
        }
    }, [toast]);

    const deleteAgent = useCallback(async (id: string) => {
        try {
            await agentApi.deleteAgent(id);
            toast({
                title: 'Agent deleted',
                description: 'The agent and its data have been removed.',
            });
            return true;
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to delete agent.',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast]);

    const loadAgentById = useCallback(async (id: string) => {
        try {
            const agent = await agentApi.getAgent(id);
            if (agent && agent.graph) {
                setNodes(agent.graph.nodes || []);
                setEdges(agent.graph.edges || []);
                return agent;
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to load agent details.',
                variant: 'destructive',
            });
        }
    }, [setNodes, setEdges, toast]);

    const loadAgents = useCallback(async (id?: string) => {
        if (id) return loadAgentById(id);

        try {
            const data = await agentApi.loadAgents();
            const agent = Array.isArray(data) ? data[0] : data;

            if (agent && agent.graph) {
                setNodes(agent.graph.nodes || []);
                setEdges(agent.graph.edges || []);
                return agent;
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to load default agent.',
                variant: 'destructive',
            });
        }
    }, [loadAgentById, setNodes, setEdges, toast]);

    const getTemplates = useCallback(async () => {
        try {
            return await agentApi.getTemplates();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to fetch templates.',
                variant: 'destructive',
            });
            return [];
        }
    }, [toast]);

    const createAgentFromTemplate = useCallback(async (templateId: string, name: string, modelProvider?: string, modelName?: string, apiKey?: string) => {
        try {
            const agent = await agentApi.createAgentFromTemplate(templateId, name, modelProvider, modelName, apiKey);
            toast({
                title: 'Agent Created',
                description: `Agent "${name}" created from template.`,
            });
            return agent;
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to create agent from template.',
                variant: 'destructive',
            });
            throw err;
        }
    }, [toast]);

    const chatWithAgent = useCallback(async (provider: string, model: string, messages: any[], apiKey?: string) => {
        return agentApi.chatWithAgent(provider, model, messages, apiKey);
    }, []);

    const chatWithAgentStream = useCallback(async (provider: string, model: string, messages: any[], apiKey?: string, agentId?: string, sessionId?: string) => {
        return agentApi.chatWithAgentStream(provider, model, messages, apiKey, agentId, sessionId);
    }, []);

    return { saveAgent, updateAgent, loadAgents, listAgents, deleteAgent, loadAgentById, getTemplates, createAgentFromTemplate, chatWithAgent, chatWithAgentStream };
};
