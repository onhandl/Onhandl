'use client';

import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { Wallet, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import ConnectWalletModal from '../modals/connect-wallet-modal';
import { useFlow } from '@/contexts/FlowContext';

interface CryptoWalletNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const CryptoWalletNode: React.FC<CryptoWalletNodeProps> = ({ data, isConnectable, selected, id }) => {
  const { updateNodeData } = useFlow();

  const isConnected = data.outputData?.connected || false;

  const [network, setNetwork] = useState(data.network || 'ckb-testnet');
  const [walletType, setWalletType] = useState(data.walletType || 'System');
  const [privateKeyInput, setPrivateKeyInput] = useState(data.privateKey || '');
  const [rpcUrl, setRpcUrl] = useState(data.rpcUrl || '');
  const [useCustomRpc, setUseCustomRpc] = useState(!!data.rpcUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  const isPrivateKey = walletType === 'Private Key';
  const isSystemWallet = walletType === 'System';
  const isMetaMask = walletType === 'MetaMask';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMetaMaskAvailable(!!(window as any).ethereum);
    }
  }, []);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value);
    updateNodeData(id, { ...data, network: e.target.value });
  };

  const handleWalletConnected = (walletInfo: any) => {
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

    updateNodeData(id, {
      ...data,
      outputData,
      inputs: data.inputs?.map((input: any) => {
        if (input.key === 'walletAddress') return { ...input, value: walletInfo.address || input.value };
        if (input.key === 'network') return { ...input, value: walletInfo.network || input.value };
        return input;
      }),
    });

    const consoleOutput = [...(data.consoleOutput || [])];
    consoleOutput.push(`[${new Date().toLocaleTimeString()}] Wallet connected: ${walletInfo.address} on ${walletInfo.network}`);
    updateNodeData(id, { consoleOutput, outputData: { ...outputData, connected: true } });
  };

  const shellClass = [
    'node-base',
    'node-indigo',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

      {/* Icon */}
      <div className="node-icon">
        <Wallet className="h-4 w-4 text-indigo-500" />
      </div>

      {/* Private Key warning */}
      {isPrivateKey && (
        <div className="absolute top-1.5 right-8 flex items-center gap-0.5">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span className="text-[9px] text-amber-600 font-bold">Private Key</span>
        </div>
      )}

      <div className="node-title">{data.name || 'Crypto Wallet'}</div>
      <div className="node-description">{data.description || 'Manage wallet connections'}</div>

      {/* Connection status */}
      <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mb-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
        <CheckCircle2 className={`h-2.5 w-2.5 ${isConnected ? 'text-green-500' : 'text-slate-400'}`} />
        {isConnected ? 'Connected' : 'Not Connected'}
      </div>

      {/* Network */}
      <div className="mb-1 relative z-10 nodrag">
        <label className="node-form-label">Network</label>
        <select value={network} onChange={handleNetworkChange} className="node-select">
          <option value="ckb-testnet">CKB Testnet</option>
          <option value="ckb-mainnet">CKB Mainnet</option>
          <option value="ckb-devnet">CKB Devnet</option>
          <option value="evm">EVM Network</option>
        </select>
      </div>

      {/* Wallet Type */}
      <div className="mb-1 relative z-10 nodrag">
        <label className="node-form-label">Wallet Type</label>
        <select
          value={walletType}
          onChange={(e) => { setWalletType(e.target.value); updateNodeData(id, { ...data, walletType: e.target.value }); }}
          className="node-select"
        >
          <option value="System">System Managed (Auto-Provisioned)</option>
          <option value="Private Key">Import Private Key</option>
        </select>
      </div>
      {/* Storage Type */}
      <div className="mb-2 relative z-10 nodrag text-[10px]">
        <label className="flex items-center gap-1.5 mb-1 node-form-label cursor-pointer text-indigo-700 font-bold">
          <input
            type="checkbox"
            checked={data.inputs?.find((i: any) => i.key === 'storageType')?.value === 'permanent'}
            onChange={(e) => {
              const val = e.target.checked ? 'permanent' : 'temporary';
              const newInputs = [...(data.inputs || [])];
              const idx = newInputs.findIndex(i => i.key === 'storageType');
              if (idx >= 0) newInputs[idx].value = val;
              else newInputs.push({ key: 'storageType', value: val });
              updateNodeData(id, { ...data, inputs: newInputs });
            }}
            className="accent-indigo-600 h-3 w-3 rounded border-gray-300"
          />
          Store Wallet Permanently
        </label>
      </div>

      {/* Custom RPC */}
      {(isPrivateKey || isSystemWallet) && (
        <div className="mb-1 relative z-10 nodrag text-[10px]">
          <label className="flex items-center gap-1.5 mb-1 node-form-label cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomRpc}
              onChange={(e) => {
                setUseCustomRpc(e.target.checked);
                if (!e.target.checked) { setRpcUrl(''); updateNodeData(id, { ...data, rpcUrl: '' }); }
              }}
              className="accent-indigo-600"
            />
            Use Custom RPC URL
          </label>
          {useCustomRpc && (
            <input
              type="text"
              placeholder="https://..."
              value={rpcUrl}
              onChange={(e) => { setRpcUrl(e.target.value); updateNodeData(id, { ...data, rpcUrl: e.target.value }); }}
              className="node-input"
            />
          )}
        </div>
      )}

      {/* MetaMask connect */}
      {isMetaMask && !isConnected && (
        <div className="mb-1 relative z-10 nodrag">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 flex items-center gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-white"
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            disabled={!isMetaMaskAvailable}
          >
            <Wallet className="h-3 w-3" />
            {isMetaMaskAvailable ? 'Connect MetaMask' : 'MetaMask Not Found'}
          </Button>
        </div>
      )}

      {/* Private Key input */}
      {isPrivateKey && !isConnected && (
        <div className="mb-1 space-y-1 relative z-10 nodrag">
          <input
            type="password"
            placeholder="Enter Private Key (0x...)"
            value={privateKeyInput}
            onChange={(e) => setPrivateKeyInput(e.target.value)}
            className="node-input"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-white"
            onClick={(e) => {
              e.stopPropagation();
              if (privateKeyInput) {
                updateNodeData(id, { ...data, privateKey: privateKeyInput });
                handleWalletConnected({ address: 'Managed Key (Hidden)', network: 'Local/Managed', connectionType: 'Private Key' });
              }
            }}
            disabled={!privateKeyInput}
          >
            Save Key
          </Button>
        </div>
      )}

      {/* System Wallet */}
      {isSystemWallet && !isConnected && (
        <div className="mb-1 relative z-10 nodrag">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-white"
            onClick={(e) => {
              e.stopPropagation();
              updateNodeData(id, { ...data, requestSystemWallet: true });
              handleWalletConnected({ address: 'System Managed (Pending)', network: data.network || 'Local', connectionType: 'System' });
            }}
          >
            Create System Wallet
          </Button>
        </div>
      )}

      {/* Connected wallet panel */}
      {isConnected && data.outputData?.walletInfo && (
        <div className="node-output-panel">
          <div className="flex items-center justify-between mb-1">
            <span className="node-output-panel-label">Connected Wallet</span>
            <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
              {data.outputData.walletInfo.network}
            </span>
          </div>
          <div className="node-output-panel-value flex items-center gap-1">
            <span className="truncate">{formatAddress(data.outputData.walletInfo.address)}</span>
            {data.outputData.walletInfo.address && (
              <a
                href={`https://etherscan.io/address/${data.outputData.walletInfo.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
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
            className={data.isPlaying && isConnected ? 'animate-ping' : ''}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="result"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
          className={data.isPlaying && isConnected ? 'animate-ping' : ''}
        />
      )}

      {/* Status dot */}
      {data.executionStatus && (
        <div className={`node-status-dot ${data.executionStatus === 'success' ? 'node-status-success'
          : data.executionStatus === 'error' ? 'node-status-error'
            : 'node-status-pending'
          }`} />
      )}

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

function formatAddress(address?: string): string {
  if (!address) return '0x...';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default CryptoWalletNode;
