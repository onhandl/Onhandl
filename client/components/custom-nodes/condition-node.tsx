'use client';

import { Handle, Position } from '@xyflow/react';
import type React from 'react';
import { useState, useEffect } from 'react';
import NodeControls from './node-controls';
import NodeOutputDisplay from '../node-output-display';
import * as LucideIcons from 'lucide-react';

interface Branch {
  outputKey: string;
  label: string;
  field: string;
  condition: string;
  value: string;
}

interface ConditionNodeProps {
  data: any;
  isConnectable: boolean;
  selected: boolean;
  id: string;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data, isConnectable, selected, id }) => {
  const isIfElse = data.name === 'If/Else';

  const IconComponent = (data.icon
    ? LucideIcons[data.icon as keyof typeof LucideIcons]
    : (isIfElse ? LucideIcons.Split : LucideIcons.GitBranch)) as React.ElementType;

  const [branches, setBranches] = useState<Branch[]>(
    data.branches || (isIfElse ? [
      { outputKey: 'if_branch', label: 'Main Condition', field: 'intent', condition: 'intent_match', value: '' }
    ] : [
      { outputKey: 'balance', label: 'Balance', field: 'intent', condition: 'intent_match', value: 'balance' },
      { outputKey: 'transfer', label: 'Transfer', field: 'intent', condition: 'intent_match', value: 'transfer' },
    ])
  );

  const [showElse, setShowElse] = useState<boolean>(isIfElse ? true : (data.showElse !== false));

  const shellClass = [
    'node-base',
    'node-amber',
    selected ? 'node-selected' : '',
    data.isActive === false ? 'node-inactive' : '',
    data.isPlaying ? 'node-playing' : '',
  ].filter(Boolean).join(' ');

  // Update effect to keep local state in sync with data updates from sidebar
  useEffect(() => {
    if (data.branches) setBranches(data.branches);
    if (data.showElse !== undefined) setShowElse(data.showElse);
  }, [data.branches, data.showElse]);

  const addBranch = () => {
    if (isIfElse && branches.length >= 1) return;
    const newBranch: Branch = {
      outputKey: `branch_${branches.length}_${Date.now()}`,
      label: `Branch ${branches.length + 1}`,
      field: 'intent',
      condition: 'intent_match',
      value: ''
    };
    const updated = [...branches, newBranch];
    setBranches(updated);
    if (data.onUpdate) data.onUpdate({ ...data, branches: updated });
  };

  return (
    <div
      className={shellClass}
      style={{
        minWidth: 320,
        padding: '16px',
        overflow: 'visible',
        backgroundColor: '#fffbeb',
        border: selected ? '2px solid #f59e0b' : '1px solid #fcd34d',
        borderRadius: '24px',
        boxShadow: selected ? '0 10px 25px -5px rgba(245, 158, 11, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      <NodeControls nodeId={id} isPlaying={data.isPlaying || false} isActive={data.isActive !== false} />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-xl border border-amber-200">
          {IconComponent && <IconComponent className="h-5 w-5 text-amber-600" />}
        </div>
        <div>
          <div className="text-sm font-black text-amber-950 leading-none tracking-tight">
            {data.name || (isIfElse ? 'If/Else' : 'Intent Router')}
          </div>
          <div className="text-[10px] text-amber-800/70 font-bold mt-1 uppercase tracking-wider">
            {isIfElse ? 'Binary Logic' : 'Multi-branch Routing'}
          </div>
        </div>
      </div>

      <div className="space-y-3 relative">
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-amber-400 border-2 border-white !left-[-22px]"
        />

        {/* Branches */}
        {branches.map((branch, index) => (
          <div key={branch.outputKey} className="relative flex items-center justify-between p-3 bg-white/60 border border-amber-200/50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-600 font-mono">IF</span>
              <span className="text-xs font-bold text-amber-900">{branch.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-700/50 font-mono italic">
                {branch.condition === 'intent_match' ? 'matches' : branch.condition}
              </span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-700">
                {branch.value || '*'}
              </span>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              id={branch.outputKey}
              isConnectable={isConnectable}
              className="w-3 h-3 bg-amber-500 border-2 border-white !right-[-22px]"
            />

            {/* Dynamic Label for Handle */}
            <div className="absolute -right-20 text-[10px] font-black text-amber-600/80 bg-white/80 px-1.5 py-0.5 rounded-md border border-amber-100 pointer-events-none uppercase tracking-tighter">
              {branch.label}
            </div>
          </div>
        ))}

        {/* Else Branch */}
        {showElse && (
          <div className="relative flex items-center justify-between p-3 bg-stone-100/50 border border-dashed border-stone-300 rounded-xl mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-500 tracking-widest">ELSE</span>
              <span className="text-[10px] text-stone-400 font-bold uppercase">Default fallback</span>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              id="default"
              isConnectable={isConnectable}
              className="w-3 h-3 bg-stone-500 border-2 border-white !right-[-22px]"
            />

            {/* Dynamic Label for Handle */}
            <div className="absolute -right-20 text-[10px] font-black text-stone-500/80 bg-white/80 px-1.5 py-0.5 rounded-md border border-stone-100 pointer-events-none uppercase tracking-tighter">
              Fallback
            </div>
          </div>
        )}
      </div>

      {/* Manual Controls (Sync with Sidebar) */}
      {!isIfElse && (
        <button
          onClick={(e) => { e.stopPropagation(); addBranch(); }}
          className="w-full mt-6 py-2 border-2 border-dashed border-amber-200/50 rounded-xl text-amber-600 text-[10px] font-black hover:bg-amber-50 hover:border-amber-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <LucideIcons.Plus className="h-3 w-3" /> Add Route
        </button>
      )}

      {/* Execution Results */}
      {data.isPlaying && data.outputData && (
        <div className="mt-6 pt-4 border-t border-amber-200/30">
          <NodeOutputDisplay nodeType="condition" nodeName={data.name} outputData={data.outputData} />
        </div>
      )}

      {/* Status Dot */}
      {data.executionStatus && (
        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${data.executionStatus === 'success' ? 'bg-green-500' :
            data.executionStatus === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
          }`} />
      )}
    </div>
  );
};

export default ConditionNode;
