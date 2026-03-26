'use client';

import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { Link } from 'lucide-react';
import { useEffect, useRef } from 'react'; // Added for FlowConsole simulation feedback

interface BlockchainNodeProps {
    data: any;
    isConnectable: boolean;
    selected: boolean;
    id: string;
}

const BlockchainNode: React.FC<BlockchainNodeProps> = ({
    data,
    isConnectable,
    selected,
    id,
}) => {
    const toolName = data.inputs?.find((input: any) => input.key === 'tool_name')?.value || 'Blockchain Tool';
    const shortName = toolName.split('.').pop() || 'Tool';

    return (
        <div
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${selected ? 'border-indigo-500 shadow-xl shadow-indigo-100' : 'border-border'} ${data.isActive === false ? 'opacity-40 grayscale' : ''
                } ${data.isPlaying ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-xl shadow-indigo-100 bg-indigo-50/30' : 'bg-card'} shadow-sm w-52 relative overflow-hidden`}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500 opacity-70" />
            <NodeControls
                nodeId={id}
                isPlaying={data.isPlaying || false}
                isActive={data.isActive !== false}
            />

            {/* Node Icon */}
            <div className="absolute top-1 left-1 flex items-center text-xs">
                <div className="flex items-center text-indigo-600">
                    <Link className="h-4 w-4" />
                </div>
            </div>

            <div className="font-bold text-sm mt-6 text-indigo-950 uppercase tracking-tight">{shortName}</div>
            <div className="text-[10px] font-semibold text-indigo-700 mb-2 leading-tight bg-indigo-100/50 px-1 rounded truncate" title={toolName}>{toolName}</div>

            {/* Input Handles */}
            {data.inputs?.map((input: any, index: number) => (
                <Handle
                    key={input.key}
                    type="target"
                    position={Position.Left}
                    id={input.key}
                    style={{ top: 50 + index * 10, background: '#555' }}
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
                    style={{ top: 50 + index * 10, background: '#555' }}
                    isConnectable={isConnectable}
                    className={data.isPlaying ? 'animate-ping bg-green-500' : ''}
                />
            ))}

            {/* Status indicator */}
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
        </div>
    );
};

export default BlockchainNode;
