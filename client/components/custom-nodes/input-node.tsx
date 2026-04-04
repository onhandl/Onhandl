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
  const IconComponent = (data.icon
    ? LucideIcons[data.icon as keyof typeof LucideIcons]
    : LucideIcons.Circle) as React.ElementType;

  const shellClass = [
    'node-base',
    'node-green',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

      <div className="node-icon">
        {IconComponent && <IconComponent className="h-4 w-4 text-green-600" />}
      </div>

      <div className="node-title">{data.name}</div>
      <div className="node-description">{data.description}</div>

      {data.outputs?.length > 0 ? (
        data.outputs.map((output: any, index: number) => (
          <Handle
            key={output.key}
            type="source"
            position={Position.Right}
            id={output.key}
            style={{ top: 40 + index * 10, background: '#555' }}
            isConnectable={isConnectable}
            className={data.isPlaying ? 'animate-ping' : ''}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="value"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
          className={data.isPlaying ? 'animate-ping' : ''}
        />
      )}

      {data.isPlaying && data.outputData && (
        <NodeOutputDisplay nodeType="input" nodeName={data.name} outputData={data.outputData} />
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

export default InputNode;
