'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Node } from '@xyflow/react';
import { useFlow } from './FlowContext';
import { useToast } from '@/components/ui';

interface NodeContextType {
  handleNodePlayPause: (nodeId: string) => void;
  handleNodeToggleActive: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleOpenNodeConsole: (nodeId: string) => void;
  updateNodeData: (nodeId: string, newData: Partial<Node['data']>) => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const NodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { nodes, setNodes, handleNodePlayPause: flowHandleNodePlayPause, handleDeleteNode: flowHandleDeleteNode, handleNodeToggleActive: flowHandleNodeToggleActive, updateNodeData: flowUpdateNodeData, handleOpenNodeConsole: flowHandleOpenNodeConsole } = useFlow();

  const handleNodePlayPause = useCallback(
    (nodeId: string) => {
      flowHandleNodePlayPause(nodeId);
    },
    [flowHandleNodePlayPause]
  );

  const handleNodeToggleActive = useCallback(
    (nodeId: string) => {
      flowHandleNodeToggleActive(nodeId);
    },
    [flowHandleNodeToggleActive]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      flowHandleDeleteNode(nodeId);
    },
    [flowHandleDeleteNode]
  );

  const handleOpenNodeConsole = useCallback(
    (nodeId: string) => {
      flowHandleOpenNodeConsole(nodeId);
    },
    [flowHandleOpenNodeConsole]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<Node['data']>) => {
      flowUpdateNodeData(nodeId, newData);
    },
    [flowUpdateNodeData]
  );

  return (
    <NodeContext.Provider
      value={{
        handleNodePlayPause,
        handleNodeToggleActive,
        handleDeleteNode,
        handleOpenNodeConsole,
        updateNodeData,
      }}
    >
      {children}
    </NodeContext.Provider>
  );
};

export const useNodeOperations = () => {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodeOperations must be used within a NodeProvider');
  }
  return context;
};
