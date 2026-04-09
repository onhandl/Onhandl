'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';
import { bubbleApi } from '@/api/bubble-api';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (bubble: any) => void;
}

export function CreateBubbleModal({ isOpen, onClose, onCreated }: Props) {
    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');
    const [agents, setAgents]           = useState<any[]>([]);
    const [selected, setSelected]       = useState<Set<string>>(new Set());
    const [interval, setInterval]       = useState(8);
    const [fanout, setFanout]           = useState(2);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');

    useEffect(() => {
        if (isOpen) apiFetch('/agents').then(setAgents).catch(() => {});
    }, [isOpen]);

    function reset() {
        setName(''); setDescription(''); setSelected(new Set());
        setInterval(8); setFanout(2); setError('');
    }

    function close() { reset(); onClose(); }

    function toggleAgent(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { setError('Name is required'); return; }
        setLoading(true); setError('');
        try {
            const bubble = await bubbleApi.create({
                name: name.trim(),
                description: description.trim() || undefined,
                agentIds: [...selected],
                gossipInterval: interval,
                fanout,
            });
            onCreated(bubble);
            close();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
                            <h2 className="font-bold text-base">New Bubble</h2>
                            <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent/40 transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="e.g. DeFi Swarm"
                                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Description <span className="font-normal">(optional)</span></label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)} rows={2}
                                    placeholder="What does this bubble do?"
                                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>

                            {/* Agent picker */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Agents ({selected.size} selected)</label>
                                <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl border border-border/60 p-2">
                                    {agents.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No agents found</p>}
                                    {agents.map(a => (
                                        <button type="button" key={a._id} onClick={() => toggleAgent(a._id)}
                                            className={cn('flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer',
                                                selected.has(a._id) ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground')}
                                        >
                                            <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', selected.has(a._id) ? 'bg-primary border-primary' : 'border-border/60')}>
                                                {selected.has(a._id) && <Check className="w-2.5 h-2.5 text-white" />}
                                            </span>
                                            <span className="truncate">{a.name}</span>
                                            <span className="ml-auto text-muted-foreground capitalize">{a.agentType?.replace('_agent','')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gossip config */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Gossip interval (s)</label>
                                    <input type="number" min={3} max={60} value={interval} onChange={e => setInterval(+e.target.value)}
                                        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Fanout (peers/round)</label>
                                    <input type="number" min={1} max={10} value={fanout} onChange={e => setFanout(+e.target.value)}
                                        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                {loading ? 'Creating…' : 'Create Bubble'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
