'use client';
import { useState, useEffect } from 'react';
import { X, Wifi, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gossipApi } from '@/api/bubble-api';
import { GOSSIP_CATALOGS } from '@/lib/gossipCatalogs';
import { cn } from '@/lib/utils';

interface Props {
    agent: { _id: string; name: string } | null;
    isOpen: boolean;
    onClose: () => void;
    onSubscribed: (agentId: string, sub: any) => void;
}

export function SubscribeModal({ agent, isOpen, onClose, onSubscribed }: Props) {
    const [catalog,    setCatalog]    = useState('');
    const [selected,   setSelected]   = useState<Set<string>>(new Set());
    const [existing,   setExisting]   = useState<any>(null);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');

    useEffect(() => {
        if (!agent || !isOpen) return;
        setCatalog(''); setSelected(new Set()); setError('');
        gossipApi.getSubscription(agent._id)
            .then(sub => { setExisting(sub); setCatalog(sub.catalog); setSelected(new Set(sub.interfaces)); })
            .catch(() => setExisting(null));
    }, [agent, isOpen]);

    function toggleIface(iface: string) {
        setSelected(prev => { const n = new Set(prev); n.has(iface) ? n.delete(iface) : n.add(iface); return n; });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!catalog) { setError('Select a catalog'); return; }
        if (!agent) return;
        setLoading(true); setError('');
        try {
            const { subscription } = await gossipApi.subscribe(agent._id, catalog, [...selected]);
            onSubscribed(agent._id, subscription);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const catalogList = Object.entries(GOSSIP_CATALOGS);
    const ifaces      = catalog ? GOSSIP_CATALOGS[catalog]?.interfaces ?? [] : [];

    return (
        <AnimatePresence>
            {isOpen && agent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-primary" />
                                <h2 className="font-bold text-sm">Subscribe to Gossip Layer</h2>
                            </div>
                            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent/40 cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Subscribing <span className="font-semibold text-foreground">{agent.name}</span> to the gossip layer
                                with declared interfaces allows compatible bubbles to route tasks to it.
                            </p>

                            {existing && (
                                <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    Already subscribed under <strong>{GOSSIP_CATALOGS[existing.catalog]?.label}</strong> — updating
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Catalog picker */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Catalog</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {catalogList.map(([key, cat]) => (
                                        <button type="button" key={key} onClick={() => { setCatalog(key); setSelected(new Set()); }}
                                            className={cn('flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-all cursor-pointer',
                                                catalog === key ? 'border-2 text-foreground' : 'border-border/60 text-muted-foreground hover:border-border')}
                                            style={{ borderColor: catalog === key ? cat.color : undefined, background: catalog === key ? `${cat.color}12` : undefined }}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interface picker */}
                            {catalog && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">
                                        Exposed interfaces <span className="font-normal">({selected.size} selected)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/60 p-2.5">
                                        {ifaces.map(iface => (
                                            <button type="button" key={iface} onClick={() => toggleIface(iface)}
                                                className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all cursor-pointer',
                                                    selected.has(iface)
                                                        ? 'bg-primary/10 text-primary border-primary/30'
                                                        : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border')}
                                            >
                                                {iface}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={loading || !catalog}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                <Wifi className="w-3.5 h-3.5" />
                                {loading ? 'Subscribing…' : existing ? 'Update Subscription' : 'Subscribe Agent'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
