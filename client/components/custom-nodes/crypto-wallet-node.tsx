'use client';

import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { Wallet, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import ConnectWalletModal from '../modals/connect-wallet-modal';
import { useFlow } from '@/contexts/FlowContext';

interface CryptoWalletNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const CryptoWalletNode: React.FC<CryptoWalletNodeProps> = ({
  data,
  isConnectable,
  selected,
  id,
}) => {
  const { updateNodeData } = useFlow();

  // Determine connection status
  const isConnected = data.outputData?.connected || false;
  const connectionType =
    data.inputs?.find((input: any) => input.key === 'connectionType')?.value || 'Wallet Address';
  const isPrivateKey = connectionType === 'Private Key';
  const isMetaMask = connectionType === 'MetaMask';

  // State for wallet connection modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if MetaMask is available in the browser
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  useEffect(() => {
    // Check if window.ethereum exists (MetaMask or other wallet)
    if (typeof window !== 'undefined') {
      setIsMetaMaskAvailable(!!window.ethereum);
    }
  }, []);

  // Update the handleWalletConnected function to ensure proper data structure
  const handleWalletConnected = (walletInfo: any) => {
    // Update node data with wallet info
    console.log('Wallet connected:', walletInfo);

    // Create a properly structured output that can be consumed by other nodes
    const outputData = {
      connected: true,
      walletInfo: {
        address: walletInfo.address || '',
        network: walletInfo.network || 'Ethereum',
        chainId: walletInfo.chainId || 1,
        currency: walletInfo.currency || 'ETH',
        connectionType: walletInfo.connectionType || 'MetaMask',
        lastUpdated: new Date().toISOString(),
      },
      balance: walletInfo.balance || '0',
    };

    // Update the node data with the wallet info
    updateNodeData(id, {
      ...data,
      outputData,
      // Add wallet info to inputs so it's visible in the sidebar
      inputs: data.inputs?.map((input: any) => {
        if (input.key === 'walletAddress') {
          return {
            ...input,
            value: walletInfo.address || input.value,
          };
        }
        if (input.key === 'network') {
          return {
            ...input,
            value: walletInfo.network || input.value,
          };
        }
        return input;
      }),
    });

    // Log successful connection to console output
    const consoleOutput = [...(data.consoleOutput || [])];
    consoleOutput.push(
      `[${new Date().toLocaleTimeString()}] Wallet connected: ${walletInfo.address} on ${walletInfo.network}`
    );

    updateNodeData(id, {
      consoleOutput,
      outputData: {
        ...outputData,
        connected: true,
      },
    });
  };

  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? 'border-blue-500' : 'border-orange-200'} ${data.isActive === false ? 'opacity-50' : ''
        } ${data.isPlaying ? 'animate-pulse shadow-lg shadow-orange-200' : ''} bg-orange-50 shadow-sm w-48 relative`}
    >
      <NodeControls
        nodeId={id}
        isPlaying={data.isPlaying || false}
        isActive={data.isActive !== false}
      />

      {/* Node Icon */}
      <div className="absolute top-1 left-1 flex items-center text-xs">
        <div className="flex items-center text-orange-600">
          <Wallet className="h-4 w-4" />
        </div>
      </div>

      {/* Security indicator for private key */}
      {isPrivateKey && (
        <div className="absolute top-1 right-8 flex items-center text-xs">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span className="text-[10px]">Private Key</span>
          </div>
        </div>
      )}

      <div className="font-medium text-sm mt-6">{data.name}</div>
      <div className="text-xs text-gray-500 mb-2">{data.description}</div>

      {/* MetaMask Connect Button (only show if MetaMask is selected and available) */}
      {isMetaMask && !isConnected && (
        <div className="mb-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            disabled={!isMetaMaskAvailable}
          >
            <Wallet className="h-3 w-3" />
            {isMetaMaskAvailable ? 'Connect MetaMask' : 'MetaMask Not Found'}
          </Button>
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
          className={data.isPlaying && isConnected ? 'animate-ping' : ''}
        />
      ))}

      {/* Display output data when the node is playing */}
      {data.isPlaying && data.outputData && (
        <div className="mt-2 p-2 bg-gray-800 border rounded-md">
          <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
            <span className="text-white">Wallet Status</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isConnected && (
            <>
              <div className="text-sm font-medium text-white">
                {data.outputData.walletInfo?.network || 'Ethereum'} Wallet
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center">
                <span className="truncate">
                  {formatAddress(data.outputData.walletInfo?.address)}
                </span>
                {data.outputData.walletInfo?.address && (
                  <a
                    href={`https://etherscan.io/address/${data.outputData.walletInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-400 hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
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

      {/* Wallet Connection Modal */}
      {isModalOpen && (
        <ConnectWalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleWalletConnected}
        />
      )}
    </div>
  );
};

// Helper function to format wallet address
function formatAddress(address?: string): string {
  if (!address) return '0x...';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default CryptoWalletNode;
