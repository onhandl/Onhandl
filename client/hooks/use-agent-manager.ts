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

    const loadAgents = useCallback(async (id?: string) => {
        try {
            const data = id ? await agentApi.getAgent(id) : await agentApi.loadAgents();
            const agent = Array.isArray(data) ? data[0] : data;

            if (agent && agent.graph) {
                setNodes(agent.graph.nodes || []);
                setEdges(agent.graph.edges || []);
                return agent;
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: 'Failed to load agent.',
                variant: 'destructive',
            });
        }
    }, [setNodes, setEdges, toast]);

    return { saveAgent, updateAgent, loadAgents };
};
