'use client';

import type React from 'react';
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import {
  type Node,
  type Edge,
  type ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { useToast } from '@/components/ui/notifications/use-toast';

interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  reactFlowInstance: ReactFlowInstance | null;
  selectedNode: Node | null;
  consoleNode: Node | null;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setReactFlowInstance: React.Dispatch<React.SetStateAction<ReactFlowInstance | null>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
  setConsoleNode: React.Dispatch<React.SetStateAction<Node | null>>;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  updateNodeData: (nodeId: string, newData: Partial<any>) => void;
  syncExecutionState: (executionState: Record<string, any>) => void;
  handleNodePlayPause: (nodeId: string) => void;
  handleNodeToggleActive: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleOpenNodeConsole: (nodeId: string) => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const FlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [consoleNode, setConsoleNode] = useState<Node | null>(null);
  const { toast } = useToast();

  const onNodesChange = (changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes: any) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const onConnect = (connection: any) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  // Synchronize state from backend execution
  const syncExecutionState = useCallback((executionState: Record<string, any>) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const nodeState = executionState[node.id];
        if (nodeState) {
          return {
            ...node,
            data: {
              ...node.data,
              outputData: nodeState.outputData,
              consoleOutput: nodeState.consoleOutput,
              executionStatus: nodeState.status,
            },
          };
        }
        return node;
      })
    );
  }, []);

  const handleNodePlayPause = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const isPlaying = !node.data.isPlaying;

            // Add a console message when play/pause state changes
            const consoleOutput = [
              ...((node.data.consoleOutput as any) || []),
              `[${new Date().toLocaleTimeString()}] Node ${isPlaying ? 'started' : 'paused'}`,
            ];

            // Backend handles execution now
            if (isPlaying) {
              toast({
                title: 'Execution Mode',
                description: 'Start simulation from the top panel to run the flow on the backend.',
              });
            }

            return {
              ...node,
              data: {
                ...node.data,
                isPlaying,
                consoleOutput,
              },
            };
          }
          return node;
        })
      );
    },
    [toast]
  );

  const handleNodeToggleActive = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const isActive = node.data.isActive === false;

          // Add a console message when active state changes
          const consoleOutput = [
            ...((node.data.consoleOutput as any) || []),
            `[${new Date().toLocaleTimeString()}] Node ${isActive ? 'activated' : 'deactivated'}`,
          ];

          return {
            ...node,
            data: {
              ...node.data,
              isActive,
              isPlaying: isActive ? node.data.isPlaying : false,
              consoleOutput,
            },
          };
        }
        return node;
      })
    );
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setSelectedNode((prev) => (prev?.id === nodeId ? null : prev));
      setConsoleNode((prev) => (prev?.id === nodeId ? null : prev));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));

      toast({
        title: 'Node deleted',
        description: 'The node has been removed from the flow.',
      });
    },
    [toast]
  );

  const handleOpenNodeConsole = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === nodeId);
        if (node) {
          setConsoleNode(node);
        }
        return nds;
      });
    },
    []
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<any>) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );
    },
    []
  );

  return (
    <FlowContext.Provider
      value={{
        nodes,
        edges,
        reactFlowInstance,
        selectedNode,
        consoleNode,
        setNodes,
        setEdges,
        setReactFlowInstance,
        setSelectedNode,
        setConsoleNode,
        onNodesChange,
        onEdgesChange,
        onConnect,
        updateNodeData,
        syncExecutionState,
        handleNodePlayPause,
        handleNodeToggleActive,
        handleDeleteNode,
        handleOpenNodeConsole,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};
