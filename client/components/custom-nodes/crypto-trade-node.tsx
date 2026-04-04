import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { TrendingUp, ArrowUpDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface CryptoTradeNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const CryptoTradeNode: React.FC<CryptoTradeNodeProps> = ({ data, isConnectable, selected, id }) => {
  // Get trade action
  const action = data.inputs?.find((input: any) => input.key === 'action')?.value || 'Buy';

  // Get wallet info from inputs or from connected nodes via outputData
  const walletInfo =
    data.inputs?.find((input: any) => input.key === 'walletInfo')?.value ||
    (data.outputData?.walletInfo ? data.outputData.walletInfo : null);

  // More flexible check for wallet connection
  const isWalletConnected = Boolean(
    walletInfo &&
    (walletInfo.connected === true ||
      walletInfo.address ||
      (typeof walletInfo === 'object' && Object.keys(walletInfo).length > 0))
  );

  // Get icon based on action
  const ActionIcon =
    action === 'Buy' ? ArrowUpRight : action === 'Sell' ? ArrowDownRight : ArrowUpDown;

  // Get token from inputs
  const token = data.inputs?.find((input: any) => input.key === 'token')?.value || 'ETH';

  // Get amount from inputs
  const amount = data.inputs?.find((input: any) => input.key === 'amount')?.value || 0.1;

  const shellClass = [
    'node-base',
    'node-amber',
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

      {/* Icon + action badge */}
      <div className="node-icon">
        <TrendingUp className="h-4 w-4 text-amber-600" />
      </div>
      <div className={`absolute top-1 right-8 flex items-center gap-0.5 text-[10px] font-semibold ${action === 'Buy' ? 'text-green-600' : action === 'Sell' ? 'text-red-600' : 'text-blue-600'
        }`}>
        <ActionIcon className="h-3 w-3" />
        {action}
      </div>

      <div className="node-title">{data.name}</div>
      <div className="node-description">{data.description}</div>

      {/* Wallet connection status indicator */}
      {isWalletConnected ? (
        <div className="text-xs mb-2 px-2 py-1 bg-green-100 text-green-700 rounded flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Wallet connected
        </div>
      ) : (
        <div className="text-xs mb-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          No wallet connected
        </div>
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

      {data.isPlaying && data.outputData && (
        <div className="node-output-panel">
          <div className="flex items-center justify-between mb-1">
            <span className="node-output-panel-label">Transaction</span>
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${data.outputData.status === 'completed' ? 'bg-green-500/20 text-green-400'
                : data.outputData.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
              {data.outputData.status === 'completed' ? 'Completed' : data.outputData.status === 'pending' ? 'Pending' : 'Failed'}
            </span>
          </div>
          <div className="node-output-panel-value">
            {action} {data.outputData.details?.amount || amount} {data.outputData.details?.token || token}
          </div>
          {data.outputData.details?.price && (
            <div className="node-output-panel-value mt-0.5">Price: ${data.outputData.details.price}</div>
          )}
          {data.outputData.transactionId && (
            <div className="node-output-panel-value mt-0.5">TX: {formatTxId(data.outputData.transactionId)}</div>
          )}
          {isWalletConnected && (
            <div className="node-output-panel-value mt-1 pt-1 border-t border-indigo-800">
              Wallet: {formatTxId(walletInfo.address)} ({walletInfo.network || 'Ethereum'})
            </div>
          )}
        </div>
      )}

      {data.executionStatus && (
        <div className={`node-status-dot ${data.executionStatus === 'success' ? 'node-status-success'
            : data.executionStatus === 'error' ? 'node-status-error'
              : 'node-status-pending'
          }`} />
      )}
    </div>
  );
};

// Helper function to format transaction ID
function formatTxId(txId: string): string {
  if (!txId) return '';
  return `${txId.substring(0, 8)}...${txId.substring(txId.length - 6)}`;
}

export default CryptoTradeNode;
