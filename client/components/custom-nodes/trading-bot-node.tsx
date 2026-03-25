import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { BrainCircuit, TrendingUp, TrendingDown, BarChart } from 'lucide-react';

interface TradingBotNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const TradingBotNode: React.FC<TradingBotNodeProps> = ({ data, isConnectable, selected, id }) => {
  // Get trading strategy
  const strategy = data.inputs?.find((input: any) => input.key === 'strategy')?.value || 'Balanced';

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

  // Get tokens to trade
  const tokens = data.inputs?.find((input: any) => input.key === 'tokens')?.value || ['ETH', 'BTC'];

  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? 'border-blue-500' : 'border-indigo-200'} ${data.isActive === false ? 'opacity-50' : ''
        } ${data.isPlaying ? 'animate-pulse shadow-lg shadow-indigo-200' : ''} bg-indigo-50 shadow-sm w-48 relative`}
    >
      <NodeControls
        nodeId={id}
        isPlaying={data.isPlaying || false}
        isActive={data.isActive !== false}
      />

      {/* Node Icon */}
      <div className="absolute top-1 left-1 flex items-center text-xs">
        <div className="flex items-center text-indigo-600">
          <BrainCircuit className="h-4 w-4" />
        </div>
      </div>

      {/* Strategy indicator */}
      <div className="absolute top-1 right-8 flex items-center text-xs">
        <div
          className={`flex items-center ${strategy === 'Aggressive'
              ? 'text-red-600'
              : strategy === 'Conservative'
                ? 'text-green-600'
                : strategy === 'Custom'
                  ? 'text-purple-600'
                  : 'text-blue-600'
            }`}
        >
          <span className="text-[10px]">{strategy}</span>
        </div>
      </div>

      <div className="font-medium text-sm mt-6">{data.name}</div>
      <div className="text-xs text-gray-500 mb-2">{data.description}</div>

      {/* Wallet connection status indicator */}
      {isWalletConnected ? (
        <div className="text-xs mb-2 px-2 py-1 bg-green-100 text-green-700 rounded flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Wallet connected: {walletInfo.network || 'Ethereum'}
        </div>
      ) : (
        <div className="text-xs mb-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          No wallet connected
        </div>
      )}

      {/* Tokens display */}
      {Array.isArray(tokens) && tokens.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tokens.map((token, index) => (
            <span
              key={index}
              className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded"
            >
              {token}
            </span>
          ))}
        </div>
      )}

      {/* Input Handles */}
      {data.inputs?.map((input: any, index: number) => (
        <Handle
          key={input.key}
          type="target"
          position={Position.Left}
          id={input.key}
          style={{ top: 40 + index * 10, background: '#555' }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Output Handles */}
      {data.outputs?.map((output: any, index: number) => (
        <Handle
          key={output.key}
          type="source"
          position={Position.Right}
          id={output.key}
          style={{ top: 40 + index * 10, background: '#555' }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Display output data when the node is playing */}
      {data.isPlaying && data.outputData && (
        <div className="mt-2 p-2 bg-gray-50 border rounded-md">
          <div className="text-xs text-gray-500 mb-1">AI Trading Analysis</div>

          {data.outputData.recommendation && (
            <div className="mb-2">
              <div className="text-sm font-medium flex items-center">
                {data.outputData.recommendation.action === 'buy' ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">Buy</span>
                  </>
                ) : data.outputData.recommendation.action === 'sell' ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">Sell</span>
                  </>
                ) : (
                  <>
                    <BarChart className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-blue-600">Hold</span>
                  </>
                )}{' '}
                {data.outputData.recommendation.token}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {data.outputData.recommendation.reason}
              </div>
            </div>
          )}

          {data.outputData.performance && (
            <div className="text-xs border-t pt-1 mt-1">
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span
                  className={
                    data.outputData.performance.winRate > 50 ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {data.outputData.performance.winRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profit:</span>
                <span
                  className={
                    data.outputData.performance.profit > 0 ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {data.outputData.performance.profit > 0 ? '+' : ''}
                  {data.outputData.performance.profit}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show execution status indicator if available */}
      {data.executionStatus && (
        <div
          className={`absolute top-0 left-0 w-2 h-2 rounded-full m-1 ${data.executionStatus === 'success'
              ? 'bg-green-500'
              : data.executionStatus === 'error'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
        />
      )}

      {/* Show processing indicator when node is playing but no output yet */}
      {data.isPlaying && !data.outputData && (
        <div className="mt-2 p-2 bg-gray-50 border rounded-md animate-pulse">
          <div className="text-xs text-gray-500">AI analyzing market data...</div>
        </div>
      )}
    </div>
  );
};

export default TradingBotNode;
