'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { useAgentManager } from '@/hooks';
import { Bot, Trash2, Search, ArrowUpRight, Loader2, FolderOpen, Clock } from 'lucide-react';

interface LoadAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (agentId: string) => void;
}

export default function LoadAgentModal({ isOpen, onClose, onSelect }: LoadAgentModalProps) {
    const { listAgents, deleteAgent } = useAgentManager();
    const [agents, setAgents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchAgents = async () => {
        setIsLoading(true);
        const data = await listAgents();
        setAgents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchAgents();
    }, [isOpen]);

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this agent? This cannot be undone.')) {
            const ok = await deleteAgent(id);
            if (ok) setAgents(prev => prev.filter(a => a._id !== id));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[580px] bg-card border-border/60 shadow-xl p-0 overflow-hidden gap-0">
                <div className="h-px w-full bg-gradient-to-r from-primary/70 to-primary/10" />

                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                                <FolderOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold leading-snug">Load Agent</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-snug mt-0">
                                    Select an agent to load its flow into the sandbox.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 pt-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search agents…"
                            className="pl-9 h-9 rounded-xl bg-background border-border/60 text-sm focus-visible:ring-primary/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 max-h-[380px] overflow-y-auto space-y-2 mt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading agents…</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map((agent) => {
                            const isPublished = !agent.isDraft;
                            return (
                                <div
                                    key={agent._id}
                                    onClick={() => { onSelect(agent._id); onClose(); }}
                                    className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-background hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-semibold text-sm leading-snug truncate">{agent.name}</h4>
                                            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                                                isPublished
                                                    ? 'bg-emerald-500/8 text-emerald-600 border-emerald-500/15'
                                                    : 'bg-amber-500/8 text-amber-600 border-amber-500/15'
                                            }`}>
                                                {isPublished ? 'Live' : 'Draft'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <span className="truncate">{agent.description || 'No description'}</span>
                                            {agent.updatedAt && (
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg hover:text-destructive hover:bg-destructive/8"
                                            onClick={(e) => handleDelete(e, agent._id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-14 border border-dashed border-border/50 rounded-xl">
                            <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? 'No agents match your search.' : 'No agents yet.'}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
