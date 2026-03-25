import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import { BrainCircuit } from 'lucide-react';

interface ProcessingNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const ProcessingNode: React.FC<ProcessingNodeProps> = ({ data, isConnectable, selected, id }) => {
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

      <div className="font-medium text-sm mt-6">{data.name}</div>
      <div className="text-xs text-gray-500 mb-2">{data.description}</div>

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
          <div className="text-xs text-gray-500 mb-1">AI Output</div>
          <div className="text-xs break-words">{JSON.stringify(data.outputData, null, 2)}</div>
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
    </div>
  );
};

export default ProcessingNode;
