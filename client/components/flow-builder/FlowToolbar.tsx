'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/buttons/button';
import { Panel } from '@xyflow/react';
import { Badge } from '@/components/ui/feedback/badge';
import { createPortal } from 'react-dom';
import {
    Plus, Save, Upload, Key, Share2, Rocket, MessageSquare,
    Loader2, MoreVertical, Play, Square,
} from 'lucide-react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FlowToolbarProps {
    isSaving: boolean;
    currentAgentId: string | null;
    currentAgent: any;
    isSimulating: boolean;
    onApiKeys: () => void;
    onAddNode: () => void;
    onSave: () => void;
    onLoad: () => void;
    onTemplates: () => void;
    onToggleSimulation: () => void;
    onPublish: () => void;
    onChat: () => void;
    onExport: () => void;
}

function StatusBadge({ currentAgent }: { currentAgent: any }) {
    if (!currentAgent) return null;
    return (
        <Badge className={currentAgent?.isDraft
            ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-100 border-zinc-200"
            : "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20"}>
            {currentAgent?.isDraft
                ? <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Draft</span>
                : <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Published</span>
            }
        </Badge>
    );
}

/** Desktop toolbar — unchanged */
function DesktopToolbar(props: FlowToolbarProps) {
    const { isSaving, currentAgentId, currentAgent, isSimulating,
        onApiKeys, onAddNode, onSave, onLoad, onTemplates,
        onToggleSimulation, onPublish, onChat, onExport } = props;

    return (
        <Panel position="top-right" className="hidden md:flex gap-2 items-center">
            {isSaving && (
                <div className="text-xs font-medium text-white animate-pulse mr-2 bg-purple-500 px-2 py-1 rounded-md border border-primary/20 shadow-sm">
                    Saving...
                </div>
            )}
            {currentAgentId && (
                <div className="flex items-center gap-2 mr-2 pr-2 border-r border-zinc-200">
                    <StatusBadge currentAgent={currentAgent} />
                    {currentAgent?.isDraft && (
                        <Button size="sm" variant="ghost" className="text-purple-300 font-bold hover:text-purple-200 hover:bg-purple-500/20 h-8 px-2" onClick={onPublish}>
                            <Rocket className="h-3.5 w-3.5 mr-1" /> Publish
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-blue-300 font-bold hover:text-blue-200 hover:bg-blue-500/20 h-8 px-2" onClick={onChat}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> Interact
                    </Button>
                    <Button size="sm" variant="ghost" className="text-emerald-300 font-bold hover:text-emerald-200 hover:bg-emerald-500/20 h-8 px-2" onClick={onExport}>
                        <Share2 className="h-3.5 w-3.5 mr-1" /> Export
                    </Button>
                </div>
            )}
            <Button variant="outline" size="sm" className="bg-purple-500" onClick={onApiKeys}>
                <Key className="h-4 w-4 mr-2" /> API Keys
            </Button>
            <Button variant="outline" size="sm" className="bg-purple-500" onClick={onAddNode}>
                <Plus className="h-4 w-4 mr-2" /> Add Node
            </Button>
            <Button variant="outline" size="sm" className="bg-purple-500" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                {currentAgentId ? 'Save Flow' : 'Create Agent'}
            </Button>
            <div className="flex bg-purple-500 rounded-md border border-input shadow-sm overflow-hidden">
                <Button variant="ghost" size="sm" className="rounded-none border-r h-9 px-3" onClick={onLoad}>
                    <Upload className="h-4 w-4 mr-2" /> Load Agent
                </Button>
                <Button variant="ghost" size="sm" className="rounded-none h-9 px-3 font-semibold text-primary/80" onClick={onTemplates}>
                    Templates
                </Button>
            </div>
            <Button variant={isSimulating ? 'destructive' : 'default'} size="sm" onClick={onToggleSimulation}>
                {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </Button>
        </Panel>
    );
}

/** Mobile navbar controls — portalled into the top navbar area (z-[60] sits above sidebar z-50) */
function MobileToolbar(props: FlowToolbarProps) {
    const { isSaving, currentAgentId, currentAgent, isSimulating,
        onApiKeys, onAddNode, onSave, onLoad, onTemplates,
        onToggleSimulation, onPublish, onChat, onExport } = props;
    const [open, setOpen] = useState(false);

    const close = (fn: () => void) => () => { fn(); setOpen(false); };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="md:hidden">
            {/* Controls injected into the mobile navbar row — positioned right side */}
            <div className="fixed top-0 right-0 z-[60] h-12 flex items-center gap-1.5 pr-3">
                {isSaving && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-white bg-purple-600 px-2 py-1 rounded-md animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving
                    </div>
                )}

                {currentAgentId && <StatusBadge currentAgent={currentAgent} />}

                <Button
                    size="sm"
                    variant={isSimulating ? 'destructive' : 'default'}
                    className="h-7 px-2.5 text-[11px] font-semibold"
                    onClick={onToggleSimulation}
                >
                    {isSimulating
                        ? <><Square className="h-3 w-3 mr-1" /> Stop</>
                        : <><Play className="h-3 w-3 mr-1" /> Run</>}
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 border-border/60 bg-background"
                    onClick={() => setOpen(o => !o)}
                    aria-label="More options"
                >
                    <MoreVertical className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="fixed top-12 right-2 z-[60] w-52 rounded-xl border border-border/60 bg-background shadow-2xl overflow-hidden">
                    {currentAgentId && (
                        <div className="border-b border-border/60 p-1">
                            {currentAgent?.isDraft && (
                                <button onClick={close(onPublish)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors">
                                    <Rocket className="h-4 w-4" /> Publish
                                </button>
                            )}
                            <button onClick={close(onChat)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                <MessageSquare className="h-4 w-4" /> Interact
                            </button>
                            <button onClick={close(onExport)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                <Share2 className="h-4 w-4" /> Export
                            </button>
                        </div>
                    )}
                    <div className="p-1">
                        <button onClick={close(onAddNode)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/40 rounded-lg transition-colors">
                            <Plus className="h-4 w-4 text-muted-foreground" /> Add Node
                        </button>
                        <button onClick={close(onSave)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/40 rounded-lg transition-colors">
                            <Save className="h-4 w-4 text-muted-foreground" /> {currentAgentId ? 'Save Flow' : 'Create Agent'}
                        </button>
                        <button onClick={close(onLoad)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/40 rounded-lg transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" /> Load Agent
                        </button>
                        <button onClick={close(onTemplates)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/40 rounded-lg transition-colors">
                            <span className="h-4 w-4 text-muted-foreground text-xs font-bold flex items-center justify-center">T</span> Templates
                        </button>
                        <button onClick={close(onApiKeys)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/40 rounded-lg transition-colors">
                            <Key className="h-4 w-4 text-muted-foreground" /> API Keys
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}

export function FlowToolbar(props: FlowToolbarProps) {
    return (
        <>
            <DesktopToolbar {...props} />
            <MobileToolbar {...props} />
        </>
    );
}
