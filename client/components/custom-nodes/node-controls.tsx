import React from 'react';
import { Play, Pause, Power, PowerOff, Trash2 } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

interface NodeControlsProps {
  nodeId: string;
  isPlaying: boolean;
  isActive: boolean;
}

const NodeControls: React.FC<NodeControlsProps> = ({
  nodeId,
  isPlaying,
  isActive,
}) => {
  const { handleNodePlayPause, handleNodeToggleActive, handleDeleteNode } = useFlow();

  const handleClick = (e: React.MouseEvent, handler: (id: string) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler(nodeId);
  };

  return (
    <div className="absolute top-0 right-0 flex gap-1 p-1 z-10">
      <button
        className="h-5 w-5 bg-white/80 hover:bg-white rounded flex items-center justify-center border-none cursor-pointer"
        onClick={(e) => handleClick(e, handleNodePlayPause)}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <button
        className={`h-5 w-5 rounded flex items-center justify-center border-none cursor-pointer ${isActive ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}`}
        onClick={(e) => handleClick(e, handleNodeToggleActive)}
        title={isActive ? 'Deactivate' : 'Activate'}
      >
        {isActive ? (
          <Power className="h-3 w-3 text-green-500" />
        ) : (
          <PowerOff className="h-3 w-3 text-red-500" />
        )}
      </button>
      <button
        className="h-5 w-5 bg-white/80 hover:bg-red-100 rounded flex items-center justify-center border-none cursor-pointer"
        onClick={(e) => handleClick(e, handleDeleteNode)}
        title="Delete"
      >
        <Trash2 className="h-3 w-3 text-red-500" />
      </button>
    </div>
  );
};

export default NodeControls;
