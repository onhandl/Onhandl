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

      <div className="node-icon">
        <BrainCircuit className="h-4 w-4 text-indigo-600" />
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
          id="text"
          style={{ background: '#555' }}
          isConnectable={isConnectable}
        />
      )}

      {/* Input Data Inspector */}
      {data.inputValues && Object.keys(data.inputValues).length > 0 && (
        <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono overflow-hidden">
          <div className="text-slate-500 mb-1 font-bold uppercase tracking-wider">Received Data:</div>
          <div className="max-h-20 overflow-y-auto">
            <pre className="text-slate-700">{JSON.stringify(data.inputValues, null, 2)}</pre>
          </div>
        </div>
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
        <div className="node-output-panel mt-2">
          <div className="node-output-panel-label mb-1">AI Output</div>
          <div className="node-output-panel-value break-words whitespace-pre-wrap">
            {JSON.stringify(data.outputData, null, 2)}
          </div>
        </div>
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

export default ProcessingNode;
