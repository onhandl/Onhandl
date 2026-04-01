'use client';

import { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import { X, Play, Pause, Trash2 } from 'lucide-react';
import { Button, Label, Separator, Switch, Badge } from '@/components/ui';

import { useFlow } from '@/contexts/FlowContext';
import { toolsApi } from '@/api';

// Import sub-components
import { AICharacterSection } from './sections/ai-character-settings';
import { WalletInfoSection } from './sections/wallet-info-section';
import { TradingAnalysisSection } from './sections/trading-analysis-section';
import { TradeInfoSection } from './sections/trade-info-section';
import { FieldRenderer } from './ui/field-renderer';
import { ConditionSettingsSection } from './sections/condition-settings-section';

interface NodeSidebarProps {
    node: Node;
    onClose: () => void;
    updateNodeData: (nodeId: string, data: any) => void;
}

export default function NodeSidebar({ node, onClose, updateNodeData }: NodeSidebarProps) {
    const [nodeData, setNodeData] = useState<any>(node.data);
    const [fetchedTools, setFetchedTools] = useState<any>(null);
    const { handleDeleteNode, handleNodePlayPause } = useFlow();

    useEffect(() => {
        setNodeData(node.data);
        if (node.type === 'blockchain_tool' && !fetchedTools) {
            toolsApi.getBlockchainTools().then(res => {
                if (res.success) setFetchedTools(res.data.grouped);
            }).catch(err => console.error("Failed to fetch tools", err));
        }
    }, [node]);

    const handleInputChange = (key: string, value: any) => {
        const updatedData = { ...nodeData };

        if (updatedData.inputs) {
            const inputIndex = updatedData.inputs.findIndex((input: any) => input.key === key);
            if (inputIndex !== -1) {
                updatedData.inputs[inputIndex].value = value;
            } else {
                // Allow dynamic fields injected by schemaDef to persist
                updatedData.inputs.push({ key, value });
            }
        }

        setNodeData(updatedData);
        updateNodeData(node.id, updatedData);
    };

    return (
        <div className="w-full md:w-80 h-full border-l border-border bg-card p-4 md:p-6 overflow-y-auto pb-20 shadow-xl">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-xl">{nodeData.name}</h3>
                    <div className="flex gap-1.5 mt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10"
                            onClick={() => handleNodePlayPause(node.id)}
                        >
                            {node.data.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => {
                                handleDeleteNode(node.id);
                                onClose();
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
                <Badge variant={node.data.isActive !== false ? "default" : "secondary"} className="text-[10px] h-5">
                    {node.data.isActive !== false ? "Active" : "Inactive"}
                </Badge>
                {!!node.data.isPlaying && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">
                        Running
                    </Badge>
                )}
            </div>

            <p className="text-sm mb-6 leading-relaxed">{nodeData.description}</p>

            <Separator className="my-4" />

            {/* Specialized Logic Sections */}
            {node.type === 'condition' && (
                <ConditionSettingsSection
                    nodeData={nodeData}
                    nodeId={node.id}
                    updateNodeData={updateNodeData}
                    setNodeData={setNodeData}
                />
            )}

            {node.type !== 'condition' && (
                <div className="space-y-4">
                    <h4 className="font-medium">Inputs</h4>
                    {(() => {
                        const inputsToRender = JSON.parse(JSON.stringify(nodeData.inputs || []));

                        if (node.type === 'blockchain_tool' && fetchedTools) {
                            const netInput = inputsToRender.find((i: any) => i.key === 'network');
                            if (netInput) netInput.options = Object.keys(fetchedTools);
                            const selNet = netInput?.value || Object.keys(fetchedTools)[0];

                            const grpInput = inputsToRender.find((i: any) => i.key === 'action_group');
                            if (grpInput && fetchedTools[selNet]) {
                                grpInput.options = Object.keys(fetchedTools[selNet]);
                            }
                            const selGrp = grpInput?.value || (fetchedTools[selNet] ? Object.keys(fetchedTools[selNet])[0] : null);

                            const toolInput = inputsToRender.find((i: any) => i.key === 'tool_lookup');
                            if (toolInput && selGrp && fetchedTools[selNet]?.[selGrp]) {
                                toolInput.type = 'select';
                                toolInput.options = fetchedTools[selNet][selGrp].map((t: any) => t.name);
                            }

                            // Completely replace generic Payload input with Strict DB Schemas
                            const selToolName = toolInput?.value || (toolInput?.options && toolInput.options.length > 0 ? toolInput.options[0] : null);
                            const activeToolDef = selToolName ? fetchedTools[selNet]?.[selGrp]?.find((t: any) => t.name === selToolName) : null;

                            const payloadIdx = inputsToRender.findIndex((i: any) => i.key === 'payload');
                            if (payloadIdx !== -1) inputsToRender.splice(payloadIdx, 1);

                            if (activeToolDef && activeToolDef.schemaDef) {
                                for (const [key, field] of Object.entries(activeToolDef.schemaDef)) {
                                    inputsToRender.push({
                                        key,
                                        label: (field as any).label,
                                        type: (field as any).type,
                                        placeholder: (field as any).placeholder || '',
                                        options: (field as any).options || [],
                                        value: nodeData.inputs?.find((i: any) => i.key === key)?.value || ''
                                    });
                                }
                            }
                        }
                        return inputsToRender.filter((i: any) => !['model', 'prompt'].includes(i.key));
                    })().map((input: any) => (
                        <div key={input.key} className="space-y-2">
                            <Label htmlFor={input.key}>{input.label}</Label>
                            <FieldRenderer input={input} handleInputChange={handleInputChange} />
                            {input.description && <p className="text-xs mt-1">{input.description}</p>}
                        </div>
                    ))}
                </div>
            )}

            {node.type !== 'condition' && nodeData.outputs && nodeData.outputs.length > 0 && (
                <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                        <h4 className="font-medium">Outputs</h4>
                        {nodeData.outputs.map((output: any) => (
                            <div key={output.key} className="p-3 border border-border rounded-xl bg-muted/50">
                                <div className="font-bold text-sm">{output.label}</div>
                                <div className="text-xs mt-0.5">Type: {output.type}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {nodeData.meta && Object.keys(nodeData.meta).length > 0 && (
                <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                        <h4 className="font-medium">Configuration</h4>
                        {Object.entries(nodeData.meta).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={key} className="text-sm">{key}</Label>
                                <Switch
                                    id={key}
                                    checked={value}
                                    onCheckedChange={(checked) => {
                                        const updatedData = { ...nodeData };
                                        updatedData.meta[key] = checked;
                                        setNodeData(updatedData);
                                        updateNodeData(node.id, updatedData);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Domain-specific sections */}
            {(nodeData.name?.includes('Bot') || node.type === 'trading_bot') && (
                <AICharacterSection
                    nodeData={nodeData}
                    nodeId={node.id}
                    updateNodeData={updateNodeData}
                    setNodeData={setNodeData}
                />
            )}

            {nodeData.name === 'Crypto Wallet' && (
                <WalletInfoSection outputData={nodeData.outputData} />
            )}

            {nodeData.name === 'Trading Bot' && (
                <TradingAnalysisSection outputData={nodeData.outputData} />
            )}

            {nodeData.name === 'Crypto Trade' && (
                <TradeInfoSection outputData={nodeData.outputData} />
            )}
        </div>
    );
}
