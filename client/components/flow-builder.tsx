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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useToast } from '@/components/ui';
import NodeLibrary from '@/components/node-library';
import NodeSidebar from '@/components/node-sidebar';
import NodeConsoleModal from '@/components/node-console-modal';
import ApiKeyModal from '@/components/api-key-modal';
import { nodeTypes } from '@/lib/node-types';
import FlowConsole from '@/components/flow-console';

import { useFlow, useSimulation } from '@/contexts';
import { useApiKeyManager, useAgentManager } from '@/hooks';
import { useAutoSave, useExecutionStream } from '@/components/flow-builder/useFlowSync';
import { useFlowHandlers } from '@/components/flow-builder/useFlowHandlers';
import CreateAgentModal from '@/components/create-agent-modal';
import LoadAgentModal from '@/components/modals/load-agent-modal';
import TemplateModal from '@/components/modals/template-modal';
import ChatSidebar from '@/components/modals/chat-sidebar';
import ExportAgentModal from '@/components/modals/export-agent-modal';
import { FlowToolbar } from '@/components/flow-builder/FlowToolbar';

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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    nodes, setNodes, edges, setEdges,
    onNodesChange, onEdgesChange, onConnect,
    selectedNode, setSelectedNode,
    setReactFlowInstance, reactFlowInstance,
    consoleNode, setConsoleNode,
    updateNodeData, syncExecutionState,
  } = useFlow();

  const { isSimulating, executionId, toggleSimulation, stopSimulation } = useSimulation();
  const { handleSaveApiKey } = useApiKeyManager();
  const { updateAgent, loadAgentById } = useAgentManager();

  // Load agent from URL on mount
  useEffect(() => {
    if (agentIdFromUrl && !currentAgentId) {
      loadAgentById(agentIdFromUrl).then((agent) => {
        if (agent) { setCurrentAgentId(agent._id); setCurrentAgent(agent); }
      });
    }
  }, [agentIdFromUrl, currentAgentId, loadAgentById]);

  useAutoSave({ nodes, edges, currentAgentId, isSimulating, updateAgent, setIsSaving });
  useExecutionStream({ isSimulating, executionId, stopSimulation, syncExecutionState });

  const {
    handleSelectAgent, handleSelectTemplate, handlePublish,
    handleToggleSimulation, handleSaveClick,
  } = useFlowHandlers({
    nodes, edges, currentAgentId, isSimulating,
    setCurrentAgentId, setCurrentAgent, setNodes, setEdges,
    setIsSaving, setIsCreateModalOpen,
    updateAgent, loadAgentById, toggleSimulation,
  });

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowBounds || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const nodeData = JSON.parse(event.dataTransfer.getData('application/nodeData'));
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { ...nodeData, isActive: true, isPlaying: false, consoleOutput: [], outputData: null, executionStatus: null },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  // Mobile tap-to-add: places node at viewport center
  const handleTapAdd = useCallback((nodeType: string, nodeData: any) => {
    const center = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: Math.random() * 400, y: Math.random() * 400 };
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: center,
      data: { ...nodeData, isActive: true, isPlaying: false, consoleOutput: [], outputData: null, executionStatus: null },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

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
            <FlowToolbar
              isSaving={isSaving}
              currentAgentId={currentAgentId}
              currentAgent={currentAgent}
              isSimulating={isSimulating}
              onApiKeys={() => setIsApiKeyModalOpen(true)}
              onAddNode={() => setIsLibraryOpen(true)}
              onSave={handleSaveClick}
              onLoad={() => setIsLoadModalOpen(true)}
              onTemplates={() => setIsTemplateModalOpen(true)}
              onToggleSimulation={handleToggleSimulation}
              onPublish={handlePublish}
              onChat={() => setIsChatOpen(true)}
              onExport={() => setIsExportModalOpen(true)}
            />
          </ReactFlow>
        </div>

        <FlowConsole />
        <NodeLibrary isOpen={isLibraryOpen} setIsOpen={setIsLibraryOpen} onTapAdd={handleTapAdd} />
        {selectedNode && (
          <NodeSidebar node={selectedNode} onClose={() => setSelectedNode(null)} updateNodeData={updateNodeData} agentId={currentAgentId ?? undefined} />
        )}
        <NodeConsoleModal node={consoleNode} isOpen={!!consoleNode} onClose={() => setConsoleNode(null)} />
        <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} onSave={handleSaveApiKey} />
        <CreateAgentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onComplete={(id) => handleSelectAgent(id)} />
        <LoadAgentModal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} onSelect={(id) => handleSelectAgent(id)} />
        <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleSelectTemplate} />
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          agentId={currentAgentId}
          isSimulating={isSimulating}
          onStartSimulation={handleToggleSimulation}
        />
        {currentAgentId && (
          <ExportAgentModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            agentId={currentAgentId}
            agentName={currentAgent?.name || 'Agent'}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-card animate-pulse font-bold">Loading Onhandl Sandbox...</div>}>
      <FlowBuilderContent />
    </Suspense>
  );
}
