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
import { Plus, Save, Upload, Key, Send, Loader2, User, Bot, Sparkles } from 'lucide-react';
import NodeLibrary from '@/components/node-library';
import NodeSidebar from '@/components/node-sidebar';
import NodeConsoleModal from '@/components/node-console-modal';
import ApiKeyModal from '@/components/api-key-modal';
import { nodeTypes } from '@/lib/node-types';

import FlowConsole from '@/components/flow-console';

import { useFlow, useSimulation } from '@/contexts';
import { useApiKeyManager, useAgentManager } from '@/hooks';
import CreateAgentModal from '@/components/create-agent-modal';
import LoadAgentModal from '@/components/modals/load-agent-modal';
import TemplateModal from '@/components/modals/template-modal';
import ChatSidebar from '@/components/modals/chat-sidebar';
import { Badge } from '@/components/ui/feedback/badge';
import {
  Rocket,
  MessageSquare,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function FlowBuilderContent() {
  const searchParams = useSearchParams();
  const agentIdFromUrl = searchParams.get('agentId');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<any>(null);

  const {
    nodes,
    setNodes,
    edges,
    setEdges,
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
  const { saveAgent, updateAgent, loadAgents, loadAgentById } = useAgentManager();
  const [isSaving, setIsSaving] = useState(false);

  // Load agent on mount if agentId is in URL
  useEffect(() => {
    if (agentIdFromUrl && !currentAgentId) {
      loadAgentById(agentIdFromUrl).then((agent) => {
        if (agent) {
          setCurrentAgentId(agent._id);
          setCurrentAgent(agent);
        }
      });
    }
  }, [agentIdFromUrl, currentAgentId, loadAgentById]);

  const startSimulation = useCallback(async () => {
    if (!currentAgentId) return;

    // Log connected graph for user debugging with vibrant colors
    const activeNodes = nodes.filter(n => n.data.isActive !== false);
    const graphSummary = {
      nodes: activeNodes.map(n => ({ id: n.id, name: n.data.name, type: n.type })),
      edges: edges.map(e => ({ from: e.source, to: e.target }))
    };

    console.log(
      "%c[Simulation] Starting Flow Execution",
      "color: #ffffff; background: #6366f1; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;"
    );
    console.log(
      "%c[Graph Summary]",
      "color: #10b981; font-weight: bold;",
      JSON.stringify(graphSummary, null, 2)
    );

    try {
      await updateAgent(currentAgentId, {
        graph: { nodes, edges }
      });
      await toggleSimulation(currentAgentId);
    } catch (error) {
      console.error('Failed to start simulation:', error);
      toast({
        title: 'Simulation Start Failed',
        description: 'Could not initiate simulation. Please try again.',
        variant: 'destructive',
      });
    }
  }, [nodes, edges, currentAgentId, toggleSimulation, updateAgent, toast]);


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
      const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const baseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
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

      eventSource.onerror = (err) => {
        console.warn('%c[SSE] Connection closed or failed. This may happen normally if the flow completes.', 'color: #94a3b8; font-style: italic;');
        stopSimulation();
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

  // Handle template selection (now creates a full agent)
  const handleSelectTemplate = (agent: any) => {
    if (agent && agent._id) {
      setCurrentAgentId(agent._id);
      setCurrentAgent(agent);
      if (agent.graph) {
        setNodes(agent.graph.nodes || []);
        setEdges(agent.graph.edges || []);
      }
      toast({
        title: 'Agent Initialized',
        description: `Workflow for "${agent.name}" created from template.`,
      });
      // Update URL without refreshing
      const newUrl = `${window.location.pathname}?agentId=${agent._id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  // Handle agent loading
  const handleSelectAgent = async (agentId: string) => {
    const agent = await loadAgentById(agentId);
    if (agent) {
      setCurrentAgentId(agent._id);
      setCurrentAgent(agent);
      toast({
        title: 'Agent Loaded',
        description: `Workflow for "${agent.name}" loaded successfully.`,
      });
      // Update URL without refreshing
      const newUrl = `${window.location.pathname}?agentId=${agent._id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handlePublish = async () => {
    if (!currentAgentId) return;
    try {
      setIsSaving(true);
      const updated = await updateAgent(currentAgentId, { isDraft: false });
      setCurrentAgent(updated);
      toast({
        title: 'Agent Published',
        description: 'Your agent is now live!',
      });
    } catch (err) {
      toast({
        title: 'Publish Failed',
        description: 'Could not publish agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSimulation = async () => {
    if (!currentAgentId && !isSimulating) {
      toast({
        title: 'Agent not saved',
        description: 'Please save your flow to an agent before running simulation.',
        variant: 'destructive',
      });
      return;
    }
    await toggleSimulation(currentAgentId || '');
  };

  // Improved Save Logic
  const handleSaveClick = async () => {
    if (!currentAgentId) {
      // Prompt to create a new agent if none is active
      setIsCreateModalOpen(true);
      return;
    }

    // Otherwise update the existing agent manually
    try {
      setIsSaving(true);
      await updateAgent(currentAgentId, { graph: { nodes, edges } });
      toast({
        title: 'Flow Saved',
        description: 'Your modifications have been persisted.',
      });
    } catch (error) {
      console.error('Manual save failed:', error);
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
                <div className="text-xs font-medium text-white animate-pulse mr-2 bg-purple-500 px-2 py-1 rounded-md border border-primary/20 shadow-sm">
                  Saving...
                </div>
              )}
              {currentAgentId && (
                <div className="flex items-center gap-2 mr-2 pr-2 border-r border-zinc-200">
                  <Badge className={currentAgent?.isDraft ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-100 border-zinc-200" : "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20"}>
                    {currentAgent?.isDraft ? (
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Draft</span>
                    ) : (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Published</span>
                    )}
                  </Badge>

                  {currentAgent?.isDraft && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-300 font-bold hover:text-purple-200 hover:bg-purple-500/20 h-8 px-2"
                      onClick={handlePublish}
                    >
                      <Rocket className="h-3.5 w-3.5 mr-1" />
                      Publish
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-300 font-bold hover:text-blue-200 hover:bg-blue-500/20 h-8 px-2"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Interact
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="bg-purple-500"
                onClick={() => setIsApiKeyModalOpen(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-purple-500"
                onClick={() => setIsLibraryOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
              <Button variant="outline" size="sm" className="bg-purple-500" onClick={handleSaveClick}>
                <Save className="h-4 w-4 mr-2" />
                {currentAgentId ? 'Save Flow' : 'Create Agent'}
              </Button>
              <div className="flex bg-purple-500 rounded-md border border-input shadow-sm overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none border-r h-9 px-3"
                  onClick={() => setIsLoadModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load Agent
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-9 px-3 font-semibold text-primary/80"
                  onClick={() => setIsTemplateModalOpen(true)}
                >
                  Templates
                </Button>
              </div>
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
        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onComplete={(agentId) => handleSelectAgent(agentId)}
        />
        <LoadAgentModal
          isOpen={isLoadModalOpen}
          onClose={() => setIsLoadModalOpen(false)}
          onSelect={(agentId) => handleSelectAgent(agentId)}
        />
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelect={(template) => handleSelectTemplate(template)}
        />
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          agentId={currentAgentId}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-card animate-pulse font-bold">Loading FlawLess Sandbox...</div>}>
      <FlowBuilderContent />
    </Suspense>
  );
}
