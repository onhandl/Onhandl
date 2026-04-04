import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import NodeOutputDisplay from '../node-output-display';
import * as LucideIcons from 'lucide-react';

interface ActionNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data, isConnectable, selected, id }) => {
  const IconComponent = (data.icon
    ? LucideIcons[data.icon as keyof typeof LucideIcons]
    : LucideIcons.Circle) as React.ElementType;

  const shellClass = [
    'node-base',
    'node-gray',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

      <div className="node-icon">
        {IconComponent && <IconComponent className="h-4 w-4 text-slate-500" />}
      </div>

      <div className="node-title">{data.name}</div>
      <div className="node-description">{data.description}</div>

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
        <NodeOutputDisplay nodeType="action" nodeName={data.name} outputData={data.outputData} />
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

export default ActionNode;
