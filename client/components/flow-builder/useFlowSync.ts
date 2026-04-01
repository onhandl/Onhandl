'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui';

interface UseFlowSyncParams {
    nodes: any[];
    edges: any[];
    currentAgentId: string | null;
    isSimulating: boolean;
    executionId: string | null;
    updateAgent: (id: string, data: any) => Promise<any>;
    stopSimulation: () => void;
    syncExecutionState: (state: any) => void;
    setIsSaving: (v: boolean) => void;
}

/** Debounced auto-save effect: persists canvas changes 2s after the last change. */
export function useAutoSave({ nodes, edges, currentAgentId, isSimulating, updateAgent, setIsSaving }: Pick<UseFlowSyncParams, 'nodes' | 'edges' | 'currentAgentId' | 'isSimulating' | 'updateAgent' | 'setIsSaving'>) {
    useEffect(() => {
        if (!currentAgentId || isSimulating) return;
        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                await updateAgent(currentAgentId, { graph: { nodes, edges } });
            } catch (err) {
                console.error('Auto-save failed:', err);
            } finally {
                setTimeout(() => setIsSaving(false), 1000);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [nodes, edges, currentAgentId, isSimulating, updateAgent, setIsSaving]);
}

/** SSE listener: streams execution state from the backend and handles completion/failure. */
export function useExecutionStream({ isSimulating, executionId, stopSimulation, syncExecutionState }: Pick<UseFlowSyncParams, 'isSimulating' | 'executionId' | 'stopSimulation' | 'syncExecutionState'>) {
    useEffect(() => {
        if (!isSimulating || !executionId) return;
        const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const base = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
        const es = new EventSource(`${base}/executions/${executionId}/stream`);

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') return;
                if (data.state) syncExecutionState(data.state);
                if (data.status === 'completed' && !data.nodeId) {
                    stopSimulation();
                    toast({ title: 'Flow completed', description: 'Execution finished successfully.' });
                    es.close();
                } else if (data.status === 'failed') {
                    stopSimulation();
                    toast({ title: 'Flow failed', description: data.error || 'Execution interrupted.', variant: 'destructive' });
                    es.close();
                }
            } catch (err) {
                console.error('SSE Parsing error:', err);
            }
        };
        es.onerror = () => { stopSimulation(); es.close(); };
        return () => es.close();
    }, [isSimulating, executionId, stopSimulation, syncExecutionState]);
}
