import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import NodeOutputDisplay from '../node-output-display';
import * as LucideIcons from 'lucide-react';

interface InputNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const InputNode: React.FC<InputNodeProps> = ({ data, isConnectable, selected, id }) => {
  // Get the icon component from Lucide
  const IconComponent = (data.icon
    ? LucideIcons[data.icon as keyof typeof LucideIcons]
    : LucideIcons.Circle) as React.ElementType;

  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? 'border-blue-500' : 'border-green-200'} ${data.isActive === false ? 'opacity-50' : ''
        } ${data.isPlaying ? 'animate-pulse shadow-lg shadow-green-200' : ''} bg-green-50 shadow-sm w-48 relative`}
    >
      <NodeControls
        nodeId={id}
        isPlaying={data.isPlaying || false}
        isActive={data.isActive !== false}
      />

      {/* Node Icon */}
      <div className="absolute top-1 left-1 flex items-center text-xs">
        <div className="flex items-center text-black-600">
          {IconComponent && <IconComponent className="h-4 w-4" />}
        </div>
      </div>

      <div className="font-medium text-sm mt-6">{data.name}</div>
      <div className="text-xs text-black-500 mb-2">{data.description}</div>

      {/* Output Handles */}
      {data.outputs?.map((output: any, index: number) => (
        <Handle
          key={output.key}
          type="source"
          position={Position.Right}
          id={output.key}
          style={{ top: 40 + index * 10, background: '#555' }}
          isConnectable={isConnectable}
          className={data.isPlaying ? 'animate-ping' : ''}
        />
      ))}

      {/* Display output data when the node is playing */}
      {data.isPlaying && data.outputData && (
        <NodeOutputDisplay nodeType="input" nodeName={data.name} outputData={data.outputData} />
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
    </div>
  );
};

export default InputNode;
