'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SimulationContextType {
  isSimulating: boolean;
  executionId: string | null;
  toggleSimulation: (agentId: string) => Promise<void>;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const toggleSimulation = useCallback(async (agentId: string) => {
    if (isSimulating) {
      setIsSimulating(false);
      setExecutionId(null);
    } else {
      // Start backend execution
      try {
        const { executionApi } = await import('@/api/execution-api');
        const execution = await executionApi.startExecution(agentId);
        setExecutionId(execution._id);
        setIsSimulating(true);
      } catch (error) {
        console.error('Failed to start simulation:', error);
      }
    }
  }, [isSimulating]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setExecutionId(null);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        isSimulating,
        executionId,
        toggleSimulation,
        stopSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
