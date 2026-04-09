'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Radio, Pause, Archive, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bubbleApi } from '@/api/bubble-api';
import { useState } from 'react';

const statusMeta = {
    active:   { label: 'Active',   color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500' },
    paused:   { label: 'Paused',   color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',   dot: 'bg-amber-500'   },
    archived: { label: 'Archived', color: 'bg-muted/60 text-muted-foreground border-border/40',    dot: 'bg-muted-foreground' },
};

interface Props {
    bubble: any;
    index: number;
    onDeleted: (id: string) => void;
    onStatusChanged: (id: string, status: string) => void;
}

export function BubbleCard({ bubble, index, onDeleted, onStatusChanged }: Props) {
    const meta = statusMeta[bubble.status as keyof typeof statusMeta] ?? statusMeta.active;
    const [menuOpen, setMenuOpen] = useState(false);

    async function toggleStatus() {
        const next = bubble.status === 'active' ? 'paused' : 'active';
        await bubbleApi.update(bubble._id, { status: next });
        onStatusChanged(bubble._id, next);
        setMenuOpen(false);
    }

    async function handleDelete() {
        if (!confirm(`Delete bubble "${bubble.name}"?`)) return;
        await bubbleApi.delete(bubble._id);
        onDeleted(bubble._id);
        setMenuOpen(false);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="relative group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/20 transition-colors duration-200"
        >
            {/* Status badge */}
            <div className="flex items-start justify-between mb-3">
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full', meta.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot, bubble.status === 'active' && 'animate-pulse')} />
                    {meta.label}
                </span>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border/60 bg-card shadow-lg overflow-hidden">
                            <button onClick={toggleStatus} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent/40 transition-colors cursor-pointer">
                                {bubble.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Radio className="w-3.5 h-3.5" /> Activate</>}
                            </button>
                            <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/8 transition-colors cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Link href={`/bubbles/${bubble._id}`}>
                <h3 className="font-bold text-base tracking-tight mb-1 hover:text-primary transition-colors cursor-pointer">{bubble.name}</h3>
            </Link>
            {bubble.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{bubble.description}</p>}

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{bubble.agentIds?.length ?? 0} agents</span>
                <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" />{bubble.messageCount ?? 0} msgs</span>
                <span className="ml-auto">{bubble.gossipInterval}s interval</span>
            </div>
        </motion.div>
    );
}
