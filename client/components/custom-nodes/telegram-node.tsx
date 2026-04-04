'use client';

import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import { useState, useEffect } from 'react';
import NodeControls from './node-controls';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { Label } from '@/components/ui/forms/label';
import { Switch } from '@/components/ui/selection/switch';
import TelegramConfigModal from '../modals/telegram-config-modal';
import { useFlow } from '@/contexts/FlowContext';

interface TelegramNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const TelegramNode: React.FC<TelegramNodeProps> = ({ data, isConnectable, selected, id }) => {
  const { updateNodeData } = useFlow();

  // State for config modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Determine connection status
  const isConnected = data.outputData?.connected || false;
  const botToken = data.inputs?.find((input: any) => input.key === 'botToken')?.value || '';
  const chatId = data.inputs?.find((input: any) => input.key === 'chatId')?.value || '';

  // Check if live mode is enabled in node data
  useEffect(() => {
    if (data.meta?.liveMode !== undefined) {
      setIsLiveMode(data.meta.liveMode);
    }
  }, [data.meta?.liveMode]);

  // Handle successful configuration
  const handleTelegramConfigured = (config: any) => {
    // Create output data structure
    const outputData = {
      connected: true,
      telegramInfo: {
        botToken: config.botToken,
        chatId: config.chatId,
        botName: config.botName || 'Trading Bot',
        lastUpdated: new Date().toISOString(),
      },
    };

    // Update node data with configuration
    updateNodeData(id, {
      outputData,
      inputs: data.inputs?.map((input: any) => {
        if (input.key === 'botToken') return { ...input, value: config.botToken || input.value };
        if (input.key === 'chatId') return { ...input, value: config.chatId || input.value };
        if (input.key === 'botName') return { ...input, value: config.botName || input.value };
        return input;
      }),
    });

    // Add console message
    const consoleOutput = [...(data.consoleOutput || [])];
    consoleOutput.push(
      `[${new Date().toLocaleTimeString()}] Telegram bot configured: ${config.botName || 'Trading Bot'}`
    );

    updateNodeData(id, { consoleOutput });
  };

  // Toggle live mode
  const toggleLiveMode = () => {
    const newLiveMode = !isLiveMode;
    setIsLiveMode(newLiveMode);

    // Update node meta data
    const meta = { ...(data.meta || {}), liveMode: newLiveMode };

    // Add console message
    const consoleOutput = [...(data.consoleOutput || [])];
    consoleOutput.push(
      `[${new Date().toLocaleTimeString()}] ${newLiveMode ? 'LIVE MODE ENABLED' : 'Switched to simulation mode'}`
    );

    updateNodeData(id, {
      meta,
      consoleOutput,
    });
  };

  const shellClass = [
    'node-base',
    'node-teal',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <NodeControls
        nodeId={id}
        isPlaying={data.isPlaying || false}
        isActive={data.isActive !== false}
      />

      {/* Node Icon */}
      <div className="node-icon">
        <MessageCircle className="h-4 w-4 text-teal-600" />
      </div>

      <div className="node-title">{data.name}</div>
      <div className="node-description">{data.description}</div>

      {/* Live Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="live-mode" className="text-xs">
            Live Mode
          </Label>
          <Switch
            id="live-mode"
            checked={isLiveMode}
            onCheckedChange={toggleLiveMode}
            className={isLiveMode ? 'bg-red-500' : ''}
          />
        </div>
        {isLiveMode && (
          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse">
            LIVE
          </span>
        )}
      </div>

      {/* Connection Status */}
      {isConnected ? (
        <div className="text-xs mb-2 px-2 py-1 bg-green-100 text-green-700 rounded flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Telegram connected
        </div>
      ) : (
        <div className="text-xs mb-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          Not connected
        </div>
      )}

      {/* Connection Button */}
      {!isConnected && (
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs h-7 flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <Send className="h-3 w-3" />
          Configure Telegram
        </Button>
      )}

      {/* Input Handles */}
      {data.inputs?.length > 0 ? (
        data.inputs.map((input: any, index: number) => (
          <Handle
            key={input.key}
            type="target"
            position={Position.Left}
            id={input.key}
            style={{ top: 40 + index * 10, background: '#555' }}
            isConnectable={isConnectable}
          />
        ))
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
        />
      )}

      {/* Output Handles */}
      {data.outputs?.length > 0 ? (
        data.outputs.map((output: any, index: number) => (
          <Handle
            key={output.key}
            type="source"
            position={Position.Right}
            id={output.key}
            style={{ top: 40 + index * 10, background: '#555' }}
            isConnectable={isConnectable}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="result"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
        />
      )}

      {/* Display output data when the node is playing */}
      {data.isPlaying && data.outputData && (
        <div className="node-output-panel">
          <div className="flex items-center justify-between mb-1">
            <span className="node-output-panel-label">Telegram Bot</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
              {isConnected ? (isLiveMode ? 'LIVE' : 'Connected') : 'Disconnected'}
            </span>
          </div>
          {isConnected && (
            <>
              <div className="node-output-panel-value">{data.outputData.telegramInfo?.botName || 'Trading Bot'}</div>
              {data.outputData.lastMessage && (
                <div className="node-output-panel-value mt-1 whitespace-pre-wrap break-words">
                  {data.outputData.lastMessage.text}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {data.executionStatus && (
        <div className={`node-status-dot ${data.executionStatus === 'success' ? 'node-status-success'
            : data.executionStatus === 'error' ? 'node-status-error'
              : 'node-status-pending'
          }`} />
      )}

      {/* Telegram Configuration Modal */}
      {isModalOpen && (
        <TelegramConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleTelegramConfigured}
          initialData={{
            botToken,
            chatId,
            botName:
              data.inputs?.find((input: any) => input.key === 'botName')?.value || 'Trading Bot',
          }}
        />
      )}
    </div>
  );
};

export default TelegramNode;
