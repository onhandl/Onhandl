'use client';

import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { Link, Cpu } from 'lucide-react';

interface BlockchainNodeProps {
    data: any;
    isConnectable: boolean;
    selected: boolean;
    id: string;
}

function parseTool(data: any) {
    const toolName: string =
        data.inputs?.find((i: any) => i.key === 'tool_name')?.value ||
        data.tool ||
        '';
    const shortName = toolName.split('.').pop() || 'Blockchain Tool';

    let parentLabel = '';
    let isCkbNode = false;
    let isFiberChannel = false;
    if (toolName.startsWith('blockchain.ckb.node.')) {
        parentLabel = 'CKB Node Instance';
        isCkbNode = true;
    } else if (toolName.startsWith('blockchain.ckb_fiber.channel')) {
        parentLabel = 'CKB Fiber';
        isFiberChannel = true;
    } else if (toolName.startsWith('blockchain.ckb_fiber.')) {
        parentLabel = 'CKB Fiber';
    } else if (toolName.startsWith('blockchain.ckb.')) {
        parentLabel = 'CKB';
    }

    return { toolName, shortName, parentLabel, isCkbNode, isFiberChannel };
}

function FiberNodeConfig({ data }: { data: any }) {
    const nodeType = data.fiberNodeType || 'managed';
    const nodeUrl  = data.fiberNodeUrl  || '';

    const update = (field: string, value: string) => {
        if (data.onFiberConfigChange) data.onFiberConfigChange(field, value);
        else data[field] = value; // fallback direct mutation
    };

    return (
        <div className="mt-2 p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 space-y-1.5 nodrag">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Fiber Node</p>
            <select
                value={nodeType}
                onChange={e => update('fiberNodeType', e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
                <option value="managed">Managed (platform node)</option>
                <option value="custom">Custom (my own node)</option>
            </select>
            {nodeType === 'custom' && (
                <input
                    type="text"
                    placeholder="http://my-fiber-node:8227 (required)"
                    value={nodeUrl}
                    onChange={e => update('fiberNodeUrl', e.target.value)}
                    className="w-full text-[10px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
            )}
        </div>
    );
}

const BlockchainNode: React.FC<BlockchainNodeProps> = ({ data, isConnectable, selected, id }) => {
    const { toolName, shortName, parentLabel, isCkbNode, isFiberChannel } = parseTool(data);

    const shellClass = [
        'node-base',
        'node-blue',
        selected ? 'node-selected' : '',
        data.isActive === false ? 'node-inactive' : '',
        data.isPlaying ? 'node-playing' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={shellClass}>
            <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

            {/* Icon */}
            <div className="node-icon">
                {isCkbNode
                    ? <Cpu className="h-4 w-4 text-indigo-500" />
                    : <Link className="h-4 w-4 text-blue-500" />
                }
            </div>

            {/* Parent label */}
            {parentLabel && (
                <div className="node-parent-label">{parentLabel}</div>
            )}

            {/* Tool short name */}
            <div className={`node-title ${parentLabel ? '!mt-0' : ''}`}>{shortName}</div>

            {/* Full tool path badge */}
            {toolName && (
                <div className="node-badge" title={toolName}>{toolName}</div>
            )}

            {/* Fiber channel node — managed vs custom node config */}
            {isFiberChannel && <FiberNodeConfig data={data} />}

            {/* Dynamic Inputs form */}
            {data.inputs?.length > 0 && (
                <div className="mt-2 space-y-2 relative z-10 nodrag">
                    {data.inputs.map((input: any) => (
                        <div key={input.key}>
                            <label className="node-form-label">{input.label || input.key}</label>
                            <input
                                type={input.type === 'number' ? 'number' : 'text'}
                                placeholder={input.placeholder || `Enter ${input.label || input.key}`}
                                className="node-input"
                                value={input.value || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Normally you'd use updateNodeData from useFlow context here
                                    // but we'll mutate directly as a fallback if context isn't hooked up
                                    input.value = input.type === 'number' ? Number(val) : val;
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Input Data Inspector */}
            {data.inputValues && Object.keys(data.inputValues).length > 0 && (
                <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono overflow-hidden mb-2">
                    <div className="text-slate-500 mb-1 font-bold uppercase tracking-wider">Received Data:</div>
                    <div className="max-h-20 overflow-y-auto">
                        <pre className="text-slate-700">{JSON.stringify(data.inputValues, null, 2)}</pre>
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
                        style={{ top: 50 + index * 10, background: '#555' }}
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
                        style={{ top: 50 + index * 10, background: '#555' }}
                        isConnectable={isConnectable}
                        className={data.isPlaying ? 'animate-ping bg-green-500' : ''}
                    />
                ))
            ) : (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="result"
                    style={{ background: '#555' }}
                    isConnectable={isConnectable}
                    className={data.isPlaying ? 'animate-ping bg-green-500' : ''}
                />
            )}

            {/* Status dot */}
            {data.executionStatus && (
                <div className={`node-status-dot ${data.executionStatus === 'success' ? 'node-status-success'
                    : data.executionStatus === 'error' ? 'node-status-error'
                        : 'node-status-pending'
                    }`} />
            )}
        </div>
    );
};

export default BlockchainNode;
