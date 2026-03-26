import React from 'react';
import { Switch } from '@/components/ui';

interface TelegramTabProps {
    telegramNodes: any[];
    enabledNodes: Record<string, boolean>;
    toggleNodeEnabled: (nodeId: string) => void;
}

export const TelegramTab: React.FC<TelegramTabProps> = ({
    telegramNodes,
    enabledNodes,
    toggleNodeEnabled,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">Telegram Nodes</h3>
            {telegramNodes.length === 0 ? (
                <p className="text-xs text-black-500">No Telegram nodes found in this flow.</p>
            ) : (
                <div className="space-y-2">
                    {telegramNodes.map((node) => (
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
                                    <div className="flex justify-between">
                                        <span className="text-black-500">Bot Token:</span>
                                        <span>
                                            {node.data.inputs?.find((input: any) => input.key === 'botToken')?.value
                                                ? '✓ Configured'
                                                : '❌ Missing'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black-500">Chat ID:</span>
                                        <span>
                                            {node.data.inputs?.find((input: any) => input.key === 'chatId')?.value
                                                ? '✓ Configured'
                                                : '❌ Missing'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
