'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Activity, Award, BarChart2, Send } from 'lucide-react';
import { bubbleApi } from '@/api/bubble-api';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    capability_announce: { label: 'Capability',   color: 'bg-primary/10 text-primary border-primary/20',           icon: Award      },
    status:              { label: 'Status',        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Activity   },
    offer:               { label: 'Offer',         color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',      icon: Zap        },
    task_claim:          { label: 'Task Claim',    color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',   icon: Radio      },
    result_update:       { label: 'Result',        color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',         icon: BarChart2  },
    task_request:        { label: 'Task Request',  color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',         icon: Send       },
};

interface Props {
    bubbleId: string;
    isActive: boolean;
    isInteracting?: boolean;
}

export function GossipFeed({ bubbleId, isActive, isInteracting = false }: Props) {
    const [messages, setMessages] = useState<any[]>([]);
    const [connected, setConnected] = useState(false);
    const bottomRef  = useRef<HTMLDivElement>(null);
    const esRef      = useRef<EventSource | null>(null);
    const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

    const addMessage = useCallback((msg: any) => {
        setMessages(prev => {
            const exists = prev.some(m => m._id === msg._id);
            if (exists) return prev;
            return [...prev.slice(-199), msg]; // keep last 200
        });
    }, []);

    // Load historical messages
    useEffect(() => {
        bubbleApi.getMessages(bubbleId, { limit: 50 })
            .then((msgs: any[]) => setMessages(msgs))
            .catch(() => {});
    }, [bubbleId]);

    // SSE stream
    useEffect(() => {
        if (!isActive) return;
        const es = bubbleApi.openStream(bubbleId);
        esRef.current = es;

        es.addEventListener('message', (e) => {
            try { addMessage(JSON.parse(e.data)); } catch { /* ignore */ }
        });
        es.onopen  = () => setConnected(true);
        es.onerror = () => setConnected(false);

        return () => { es.close(); esRef.current = null; setConnected(false); };
    }, [bubbleId, isActive, addMessage]);

    // Polling fallback — only when user is actively interacting AND SSE is down
    useEffect(() => {
        if (!isActive || !isInteracting || connected) return;
        pollRef.current = setInterval(async () => {
            try {
                const msgs = await bubbleApi.getMessages(bubbleId, { limit: 20 });
                msgs.forEach(addMessage);
            } catch { /* ignore */ }
        }, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [bubbleId, isActive, isInteracting, connected, addMessage]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 pr-28 border-b border-border/40">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Radio className="w-4 h-4 text-primary" />
                    Gossip Feed
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground')} />
                    {connected ? 'Live' : 'Polling'}
                    <span className="text-border/60">·</span>
                    {messages.length} msgs
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                        <Radio className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Waiting for gossip…</p>
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const meta = TYPE_META[msg.type] ?? TYPE_META.status;
                        const Icon = meta.icon;
                        return (
                            <motion.div
                                key={msg._id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5"
                            >
                                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full shrink-0 mt-0.5', meta.color)}>
                                    <Icon className="w-2.5 h-2.5" />
                                    {meta.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">
                                        <span className="text-foreground">{msg.fromAgentName}</span>
                                        {msg.toAgentIds?.length > 0 && <span className="text-muted-foreground"> → {msg.toAgentIds.length} peer{msg.toAgentIds.length > 1 ? 's' : ''}</span>}
                                        {msg.toAgentIds?.length === 0 && <span className="text-muted-foreground"> → broadcast</span>}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        {JSON.stringify(msg.payload).slice(0, 80)}
                                    </p>
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
