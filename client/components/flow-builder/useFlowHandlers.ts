'use client';

import { useCallback } from 'react';
import { toast } from '@/components/ui';

interface FlowHandlerParams {
    nodes: any[];
    edges: any[];
    currentAgentId: string | null;
    isSimulating: boolean;
    setCurrentAgentId: (id: string) => void;
    setCurrentAgent: (agent: any) => void;
    setNodes: (fn: any) => void;
    setEdges: (fn: any) => void;
    setIsSaving: (v: boolean) => void;
    setIsCreateModalOpen: (v: boolean) => void;
    updateAgent: (id: string, data: any) => Promise<any>;
    loadAgentById: (id: string) => Promise<any>;
    toggleSimulation: (id: string) => Promise<void>;
}

export function useFlowHandlers({
    nodes, edges, currentAgentId, isSimulating,
    setCurrentAgentId, setCurrentAgent, setNodes, setEdges,
    setIsSaving, setIsCreateModalOpen,
    updateAgent, loadAgentById, toggleSimulation,
}: FlowHandlerParams) {
    const handleSelectAgent = useCallback(async (agentId: string) => {
        const agent = await loadAgentById(agentId);
        if (agent) {
            setCurrentAgentId(agent._id);
            setCurrentAgent(agent);
            toast({ title: 'Agent Loaded', description: `Workflow for "${agent.name}" loaded successfully.` });
            window.history.pushState({}, '', `${window.location.pathname}?agentId=${agent._id}`);
        }
    }, [loadAgentById, setCurrentAgentId, setCurrentAgent]);

    const handleSelectTemplate = useCallback((agent: any) => {
        if (agent && agent._id) {
            setCurrentAgentId(agent._id);
            setCurrentAgent(agent);
            if (agent.graph) {
                setNodes(agent.graph.nodes || []);
                setEdges(agent.graph.edges || []);
            }
            toast({ title: 'Agent Initialized', description: `Workflow for "${agent.name}" created from template.` });
            window.history.pushState({}, '', `${window.location.pathname}?agentId=${agent._id}`);
        }
    }, [setCurrentAgentId, setCurrentAgent, setNodes, setEdges]);

    const handlePublish = useCallback(async () => {
        if (!currentAgentId) return;
        try {
            setIsSaving(true);
            const updated = await updateAgent(currentAgentId, { isDraft: false });
            setCurrentAgent(updated);
            toast({ title: 'Agent Published', description: 'Your agent is now live!' });
        } catch {
            toast({ title: 'Publish Failed', description: 'Could not publish agent. Please try again.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }, [currentAgentId, updateAgent, setCurrentAgent, setIsSaving]);

    const handleToggleSimulation = useCallback(async () => {
        if (!currentAgentId && !isSimulating) {
            toast({ title: 'Agent not saved', description: 'Please save your flow to an agent before running simulation.', variant: 'destructive' });
            return;
        }
        await toggleSimulation(currentAgentId || '');
    }, [currentAgentId, isSimulating, toggleSimulation]);

    const handleSaveClick = useCallback(async () => {
        if (!currentAgentId) { setIsCreateModalOpen(true); return; }
        try {
            setIsSaving(true);
            await updateAgent(currentAgentId, { graph: { nodes, edges } });
            toast({ title: 'Flow Saved', description: 'Your modifications have been persisted.' });
        } catch (err) {
            console.error('Manual save failed:', err);
        } finally {
            setIsSaving(false);
        }
    }, [currentAgentId, nodes, edges, updateAgent, setIsSaving, setIsCreateModalOpen]);

    const handleStartSimulation = useCallback(async () => {
        if (!currentAgentId) return;
        try {
            await updateAgent(currentAgentId, { graph: { nodes, edges } });
            await toggleSimulation(currentAgentId);
        } catch (err) {
            console.error('Failed to start simulation:', err);
            toast({ title: 'Simulation Start Failed', description: 'Could not initiate simulation. Please try again.', variant: 'destructive' });
        }
    }, [nodes, edges, currentAgentId, toggleSimulation, updateAgent]);

    return { handleSelectAgent, handleSelectTemplate, handlePublish, handleToggleSimulation, handleSaveClick, handleStartSimulation };
}
