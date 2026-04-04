import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import NodeControls from './node-controls';
import NodeOutputDisplay from '../node-output-display';
import * as LucideIcons from 'lucide-react';

interface OutputNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const OutputNode: React.FC<OutputNodeProps> = ({ data, isConnectable, selected, id }) => {
  const IconComponent = (data.icon
    ? LucideIcons[data.icon as keyof typeof LucideIcons]
    : LucideIcons.Circle) as React.ElementType;

  const shellClass = [
    'node-base',
    'node-purple',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

      <div className="node-icon">
        {IconComponent && <IconComponent className="h-4 w-4 text-purple-600" />}
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
            className={data.isPlaying ? 'animate-ping' : ''}
          />
        ))
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          id="text"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
          className={data.isPlaying ? 'animate-ping' : ''}
        />
      )}

      {/* Input Data Inspector (for debugging) */}
      {data.inputValues && Object.keys(data.inputValues).length > 0 && (
        <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono overflow-hidden">
          <div className="text-slate-500 mb-1 font-bold uppercase tracking-wider">Received Data:</div>
          <div className="max-h-20 overflow-y-auto">
            <pre className="text-slate-700">{JSON.stringify(data.inputValues, null, 2)}</pre>
          </div>
        </div>
      )}

      {data.isPlaying && data.outputData && (
        <NodeOutputDisplay nodeType="output" nodeName={data.name} outputData={data.outputData} />
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

export default OutputNode;
