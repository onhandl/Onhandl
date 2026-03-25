'use client';

import type React from 'react';
import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button, useToast, toast } from '@/components/ui';
import { Plus, Save, Upload, Key } from 'lucide-react';
import NodeLibrary from '@/components/node-library';
import NodeSidebar from '@/components/node-sidebar';
import NodeConsoleModal from '@/components/node-console-modal';
import ApiKeyModal from '@/components/api-key-modal';
import { nodeTypes } from '@/lib/node-types';

import FlowConsole from '@/components/flow-console';

import { useFlow, useSimulation } from '@/contexts';
import { useApiKeyManager, useAgentManager } from '@/hooks';

function FlowBuilderContent() {
  const searchParams = useSearchParams();
  const agentIdFromUrl = searchParams.get('agentId');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  const {
    nodes,
    setNodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNode,
    setSelectedNode,
    setReactFlowInstance,
    reactFlowInstance,
    handleNodePlayPause,
    handleDeleteNode,
    consoleNode,
    setConsoleNode,
    updateNodeData,
    syncExecutionState,
  } = useFlow();

  const { isSimulating, executionId, toggleSimulation, stopSimulation } = useSimulation();
  const { handleSaveApiKey } = useApiKeyManager();
  const { saveAgent, updateAgent, loadAgents } = useAgentManager();
  const [isSaving, setIsSaving] = useState(false);

  // Load agent on mount if agentId is in URL
  useEffect(() => {
    if (agentIdFromUrl && !currentAgentId) {
      loadAgents(agentIdFromUrl).then((agent) => {
        if (agent) setCurrentAgentId(agent._id);
      });
    }
  }, [agentIdFromUrl, currentAgentId, loadAgents]);


  // Auto-save logic: Debounce node/edge changes to the backend
  useEffect(() => {
    if (!currentAgentId || isSimulating) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateAgent(currentAgentId, {
          graph: { nodes, edges }
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, currentAgentId, isSimulating, updateAgent]);

  // Listen for real-time Server-Sent Events from backend executions
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (isSimulating && executionId) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      eventSource = new EventSource(`${baseUrl}/executions/${executionId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') return;

          if (data.state) {
            syncExecutionState(data.state);
          }

          if (data.status === 'completed' && !data.nodeId) {
            // End of execution
            stopSimulation();
            toast({
              title: 'Flow completed',
              description: 'Execution finished successfully.',
              variant: 'default',
            });
            eventSource?.close();
          } else if (data.status === 'failed') {
            stopSimulation();
            toast({
              title: 'Flow failed',
              description: data.error || 'Execution interrupted.',
              variant: 'destructive',
            });
            eventSource?.close();
          }
        } catch (error) {
          console.error('SSE Parsing error:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE execution stream closed or failed');
        eventSource?.close();
      };
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isSimulating, executionId, stopSimulation, syncExecutionState, toast]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodeData'));

      const enhancedNodeData = {
        ...nodeData,
        isActive: true,
        isPlaying: false,
        consoleOutput: [],
        outputData: null,
        executionStatus: null,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: enhancedNodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const handleToggleSimulation = async () => {
    if (!currentAgentId && !isSimulating) {
      toast({
        title: 'Agent not saved',
        description: 'Please save your agent before running simulation.',
        variant: 'destructive',
      });
      return;
    }
    await toggleSimulation(currentAgentId || '');
  };

  const handleSave = async (name: string) => {
    try {
      setIsSaving(true);
      const result: any = await saveAgent(name, undefined, { nodes, edges });
      if (result?._id) {
        setCurrentAgentId(result._id);
      }
      toast({
        title: 'Flow Saved',
        description: 'Agent and workflow persisted successfully.',
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <ReactFlowProvider>
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="flex gap-2 items-center">
              {isSaving && (
                <div className="text-xs font-medium text-primary animate-pulse mr-2 bg-white/80 px-2 py-1 rounded-md border border-primary/20 shadow-sm">
                  Saving...
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80"
                onClick={() => setIsApiKeyModalOpen(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80"
                onClick={() => setIsLibraryOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
              <Button variant="outline" size="sm" className="bg-white/80" onClick={() => handleSave('Untitled Agent')}>
                <Save className="h-4 w-4 mr-2" />
                Save Flow
              </Button>
              <Button variant="outline" size="sm" className="bg-white/80" onClick={() => loadAgents()}>
                <Upload className="h-4 w-4 mr-2" />
                Load Flow
              </Button>
              <Button
                variant={isSimulating ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleSimulation}
              >
                {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
              </Button>
            </Panel>

          </ReactFlow>
        </div>

        <FlowConsole />
        <NodeLibrary isOpen={isLibraryOpen} setIsOpen={setIsLibraryOpen} />
        {selectedNode && (
          <NodeSidebar
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            updateNodeData={updateNodeData}
          />
        )}
        <NodeConsoleModal
          node={consoleNode}
          isOpen={!!consoleNode}
          onClose={() => setConsoleNode(null)}
        />
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleSaveApiKey}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-card text-muted-foreground animate-pulse font-bold">Loading Omniflow Sandbox...</div>}>
      <FlowBuilderContent />
    </Suspense>
  );
}
