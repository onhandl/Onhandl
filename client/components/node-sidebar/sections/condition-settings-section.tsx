'use client';

import React from 'react';
import { Plus, Trash2, GitBranch, X, HelpCircle } from 'lucide-react';
import { Button, Input, Label, Separator, Badge } from '@/components/ui';

interface Branch {
    outputKey: string;
    label: string;
    field: string;
    condition: string;
    value: string;
}

interface ConditionSettingsSectionProps {
    nodeData: any;
    nodeId: string;
    updateNodeData: (nodeId: string, data: any) => void;
    setNodeData: (data: any) => void;
}

const CONDITION_OPTIONS = ['intent_match', 'equals', 'contains', 'exists', 'greaterThan', 'lessThan'];

export function ConditionSettingsSection({ nodeData, nodeId, updateNodeData, setNodeData }: ConditionSettingsSectionProps) {
    const isIfElse = nodeData.name === 'If/Else';
    const branches: Branch[] = nodeData.branches || [];
    const showElse = isIfElse ? true : (nodeData.showElse !== false);

    // Initial sync for If/Else to ensure it has at least one branch
    React.useEffect(() => {
        if (isIfElse && branches.length === 0) {
            const initialBranch: Branch = {
                outputKey: 'if_branch',
                label: 'Main Condition',
                field: 'intent',
                condition: 'intent_match',
                value: ''
            };
            syncChanges([initialBranch], true);
        }
    }, [isIfElse]);

    // Helper to sync all changes to node state and XYFlow outputs
    const syncChanges = (updatedBranches: Branch[], updatedShowElse: boolean) => {
        const updatedNodeData = {
            ...nodeData,
            branches: updatedBranches,
            showElse: updatedShowElse
        };

        // Sync outputs for visual consistency in the flow builder
        updatedNodeData.outputs = [
            ...updatedBranches.map((b: Branch) => ({ key: b.outputKey, label: b.label, type: 'boolean' })),
            ...(updatedShowElse ? [{ key: 'default', label: 'ELSE', type: 'boolean' }] : [])
        ];

        setNodeData(updatedNodeData);
        updateNodeData(nodeId, updatedNodeData);
    };

    const updateBranch = (index: number, key: keyof Branch, value: string) => {
        const updated = [...branches];
        updated[index] = { ...updated[index], [key]: value };
        syncChanges(updated, showElse);
    };

    const addBranch = () => {
        if (isIfElse && branches.length >= 1) return; // Only 1 branch for If/Else
        const newBranch: Branch = {
            outputKey: `branch_${branches.length}_${Date.now()}`,
            label: `Branch ${branches.length + 1}`,
            field: 'intent',
            condition: 'intent_match',
            value: ''
        };
        syncChanges([...branches, newBranch], showElse);
    };

    const removeBranch = (index: number) => {
        if (isIfElse) return; // Cannot remove main branch of If/Else
        syncChanges(branches.filter((_, i) => i !== index), showElse);
    };

    const toggleElse = () => {
        if (isIfElse) return; // Cannot toggle else of If/Else
        syncChanges(branches, !showElse);
    };

    return (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground transition-all">
                        {isIfElse ? 'Condition Logic' : 'Routing Logic'}
                    </h4>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                    {branches.length + (showElse ? 1 : 0)} {isIfElse ? 'Paths' : 'Active Paths'}
                </Badge>
            </div>

            <div className="space-y-4">
                {branches.map((branch: Branch, index: number) => (
                    <div key={branch.outputKey} className="group p-4 bg-muted/30 border border-border rounded-2xl space-y-3 transition-all hover:bg-muted/50 hover:border-primary/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 mr-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-none border-none text-[10px] px-1.5 h-5 flex items-center justify-center font-bold font-mono">
                                    IF
                                </Badge>
                                <Input
                                    value={branch.label}
                                    onChange={(e) => updateBranch(index, 'label', e.target.value)}
                                    placeholder="Condition Label"
                                    className="h-7 text-xs font-bold bg-transparent border-none shadow-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                    disabled={isIfElse} // Lock label for simple If/Else
                                />
                            </div>
                            {!isIfElse && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                    onClick={() => removeBranch(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground ml-1">Operator</Label>
                                <select
                                    value={branch.condition}
                                    onChange={(e) => updateBranch(index, 'condition', e.target.value)}
                                    className="w-full text-xs bg-background border border-border rounded-lg px-2 h-8 outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                                >
                                    {CONDITION_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground ml-1">Value</Label>
                                <Input
                                    value={branch.value}
                                    onChange={(e) => updateBranch(index, 'value', e.target.value)}
                                    placeholder="Match value"
                                    className="h-8 text-xs bg-background border-border"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {showElse && (
                    <div className="flex items-center justify-between p-3 bg-muted/20 border border-dashed border-border rounded-xl group transition-all hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-black tracking-widest bg-stone-100 text-stone-500 border-stone-200">
                                ELSE
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">Default fallback path</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                            onClick={toggleElse}
                            title="Hide else branch"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 h-9 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold gap-2 rounded-xl transition-all"
                        onClick={addBranch}
                    >
                        <Plus className="h-3 w-3" /> Add Branch
                    </Button>
                    {!showElse && (
                        <Button
                            variant="secondary"
                            className="h-9 px-4 text-xs font-bold rounded-xl active:scale-95 transition-all"
                            onClick={toggleElse}
                        >
                            + Else
                        </Button>
                    )}
                </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex gap-3">
                <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-normal">
                    Logical routing evaluates branches from top to bottom. The first matching branch determines the exit path.
                </p>
            </div>
        </div>
    );
}
