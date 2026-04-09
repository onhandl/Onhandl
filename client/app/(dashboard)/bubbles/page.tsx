'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Radio, Activity, LayoutGrid, Network } from 'lucide-react';
import { bubbleApi } from '@/api/bubble-api';
import { BubbleCard } from '@/components/bubbles/BubbleCard';
import { CreateBubbleModal } from '@/components/bubbles/CreateBubbleModal';
import { BubblesOverviewViz } from '@/components/bubbles/BubblesOverviewViz';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function BubblesPage() {
    const [bubbles, setBubbles]       = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [viewMode, setViewMode]     = useState<'grid' | 'viz'>('grid');

    useEffect(() => {
        bubbleApi.list()
            .then(setBubbles)
            .catch((e: any) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const active  = bubbles.filter(b => b.status === 'active').length;
    const total   = bubbles.length;
    const msgs    = bubbles.reduce((s, b) => s + (b.messageCount ?? 0), 0);

    return (
        <div className="min-h-full bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-7">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="flex items-center justify-between mb-5"
                >
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Bubbles</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Gossip-driven agent clusters — agents share capabilities and delegate tasks emergently
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-muted/30">
                            <button onClick={() => setViewMode('grid')}
                                className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                                    viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                                <LayoutGrid className="w-3.5 h-3.5" /> Grid
                            </button>
                            <button onClick={() => setViewMode('viz')}
                                className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                                    viewMode === 'viz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                                <Network className="w-3.5 h-3.5" /> Network
                            </button>
                        </div>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            New Bubble
                        </button>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-7">
                    {[
                        { label: 'Total Bubbles',  value: total,  accent: 'text-primary' },
                        { label: 'Active',         value: active, accent: 'text-emerald-500' },
                        { label: 'Gossip Messages',value: msgs,   accent: 'text-amber-500' },
                    ].map(({ label, value, accent }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05, ease }}
                            className="rounded-2xl border border-border/60 bg-card px-5 py-4"
                        >
                            <div className={`text-2xl font-extrabold tracking-tight ${accent}`}>{value}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-24 gap-3">
                        <Activity className="w-5 h-5 text-primary animate-pulse" />
                        <span className="text-sm text-muted-foreground">Loading bubbles…</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-sm text-destructive mb-4">{error}</div>
                )}

                {/* Empty */}
                {!loading && bubbles.length === 0 && !error && (
                    <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                            <Radio className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-semibold text-[15px] mb-1">No bubbles yet</p>
                        <p className="text-sm text-muted-foreground mb-5">Create a bubble to connect agents in a gossip mesh.</p>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Bubble
                        </button>
                    </div>
                )}

                {/* Grid */}
                {!loading && bubbles.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bubbles.map((b, i) => (
                            <BubbleCard
                                key={b._id}
                                bubble={b}
                                index={i}
                                onDeleted={(id) => setBubbles(prev => prev.filter(x => x._id !== id))}
                                onStatusChanged={(id, status) => setBubbles(prev => prev.map(x => x._id === id ? { ...x, status } : x))}
                            />
                        ))}
                    </div>
                )}

                {/* Network visualization */}
                {!loading && bubbles.length > 0 && viewMode === 'viz' && (
                    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ height: '520px' }}>
                        <BubblesOverviewViz bubbles={bubbles} />
                    </div>
                )}
            </div>

            <CreateBubbleModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(b) => { setBubbles(prev => [b, ...prev]); setCreateOpen(false); }}
            />
        </div>
    );
}
