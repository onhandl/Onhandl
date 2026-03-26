import React from 'react';
import { Shield } from 'lucide-react';
import { Switch } from '@/components/ui';

interface TradingTabProps {
    tradeNodes: any[];
    enabledNodes: Record<string, boolean>;
    toggleNodeEnabled: (nodeId: string) => void;
    riskLevels: Record<string, 'low' | 'medium' | 'high'>;
    setNodeRiskLevel: (nodeId: string, level: 'low' | 'medium' | 'high') => void;
}

export const TradingTab: React.FC<TradingTabProps> = ({
    tradeNodes,
    enabledNodes,
    toggleNodeEnabled,
    riskLevels,
    setNodeRiskLevel,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">Trading Nodes</h3>
            {tradeNodes.length === 0 ? (
                <p className="text-xs text-black-500">No trading nodes found in this flow.</p>
            ) : (
                <div className="space-y-2">
                    {tradeNodes.map((node) => (
                        <div key={node.id} className="p-2 border rounded-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{node.data.name}</span>
                                <Switch
                                    checked={enabledNodes[node.id] || false}
                                    onCheckedChange={() => toggleNodeEnabled(node.id)}
                                />
                            </div>
                            {enabledNodes[node.id] && (
                                <div className="mt-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-black-500">Risk Level:</span>
                                        <div className="flex gap-1">
                                            {(['low', 'medium', 'high'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    className={`px-2 py-0.5 rounded text-[10px] ${riskLevels[node.id] === level
                                                        ? `bg-${level === 'low' ? 'green' : level === 'medium' ? 'yellow' : 'red'}-100 text-${level === 'low' ? 'green' : level === 'medium' ? 'yellow' : 'red'}-700`
                                                        : 'bg-gray-100'
                                                        }`}
                                                    onClick={() => setNodeRiskLevel(node.id, level)}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Risk Levels
                </h3>
                <p className="text-xs mt-1 text-blue-700">
                    <strong>Low:</strong> Max 0.1 ETH per trade, max 3 trades per day
                    <br />
                    <strong>Medium:</strong> Max 0.5 ETH per trade, max 10 trades per day
                    <br />
                    <strong>High:</strong> Max 1.0 ETH per trade, max 20 trades per day
                </p>
            </div>
        </div>
    );
};
