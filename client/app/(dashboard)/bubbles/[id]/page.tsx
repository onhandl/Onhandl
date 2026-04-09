'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Radio, Send, Pause, Play, UserPlus, UserMinus, Wifi, AlertTriangle, Pencil, X } from 'lucide-react';
import { bubbleApi } from '@/api/bubble-api';
import { apiFetch } from '@/lib/api-client';
import { GossipFeed } from '@/components/bubbles/GossipFeed';
import { BubbleNetworkViz } from '@/components/bubbles/BubbleNetworkViz';
import { FlipCard } from '@/components/bubbles/FlipCard';
import { SubscribeModal } from '@/components/bubbles/SubscribeModal';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function BubbleDetailPage() {
    const { id }        = useParams<{ id: string }>();
    const router        = useRouter();
    const [bubble, setBubble]         = useState<any>(null);
    const [allAgents, setAll]         = useState<any[]>([]);
    const [taskInput, setTask]        = useState('');
    const [submitting, setSub]        = useState(false);
    const [loading, setLoad]          = useState(true);
    const [warnings, setWarnings]       = useState<string[]>([]);
    const [subscribeAgent, setSubAgent] = useState<any>(null);
    const [editMode, setEditMode]         = useState(false);
    const [isInteracting, setInteracting] = useState(false);
    const interactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [removeTarget, setRemoveTarget] = useState<any>(null); // agent pending removal
    const [confirmName, setConfirmName]   = useState('');

    useEffect(() => {
        Promise.all([bubbleApi.get(id), apiFetch('/agents')])
            .then(([b, a]) => { setBubble(b); setAll(a); })
            .catch(() => {})
            .finally(() => setLoad(false));
    }, [id]);

    async function toggleStatus() {
        const next    = bubble.status === 'active' ? 'paused' : 'active';
        const updated = await bubbleApi.update(id, { status: next });
        setBubble((b: any) => ({ ...b, status: updated.status }));
    }

    async function addAgent(agentId: string) {
        const ids     = [...(bubble.agentIds ?? []), agentId];
        const updated = await bubbleApi.update(id, { agentIds: ids });
        if (updated.warnings?.length) setWarnings(updated.warnings);
        setBubble((b: any) => ({ ...b, agentIds: updated.agentIds, agents: updated.agents ?? b.agents }));
    }

    async function removeAgent(agentId: string) {
        const ids     = (bubble.agentIds ?? []).filter((x: string) => x !== agentId);
        const updated = await bubbleApi.update(id, { agentIds: ids });
        setBubble((b: any) => ({ ...b, agentIds: updated.agentIds, agents: updated.agents ?? b.agents }));
    }

    async function confirmRemove() {
        if (!removeTarget || confirmName.trim() !== removeTarget.name) return;
        await removeAgent(String(removeTarget._id));
        setRemoveTarget(null);
        setConfirmName('');
    }

    function triggerInteracting() {
        setInteracting(true);
        if (interactTimer.current) clearTimeout(interactTimer.current);
        interactTimer.current = setTimeout(() => setInteracting(false), 12000);
    }

    async function handleTask(e: React.FormEvent) {
        e.preventDefault();
        if (!taskInput.trim()) return;
        setSub(true);
        try { await bubbleApi.submitTask(id, taskInput.trim()); setTask(''); triggerInteracting(); }
        finally { setSub(false); }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-full">
            <Radio className="w-6 h-6 text-primary animate-pulse" />
        </div>
    );
    if (!bubble) return (
        <div className="flex flex-col items-center justify-center min-h-full gap-3">
            <p className="text-sm text-muted-foreground">Bubble not found</p>
            <button onClick={() => router.push('/bubbles')} className="text-xs text-primary cursor-pointer">← Back</button>
        </div>
    );

    const memberIds  = new Set((bubble.agentIds ?? []).map(String));
    const nonMembers = allAgents.filter(a => !memberIds.has(String(a._id)));
    const feedHeight = 'h-[68vh]';

    return (
        <div className="min-h-full bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-7">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
                    className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.push('/bubbles')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/40 transition-colors cursor-pointer text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-extrabold tracking-tight truncate">{bubble.name}</h1>
                        {bubble.description && <p className="text-sm text-muted-foreground truncate">{bubble.description}</p>}
                    </div>
                    <button onClick={toggleStatus} className={cn('inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-full transition-colors cursor-pointer',
                        bubble.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20')}>
                        {bubble.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                    </button>
                </motion.div>

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Compatibility warnings</p>
                            {warnings.map((w, i) => <p key={i}>{w}</p>)}
                        </div>
                        <button onClick={() => setWarnings([])} className="ml-auto cursor-pointer opacity-60 hover:opacity-100">✕</button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left panel */}
                    <div className="space-y-4">
                        {/* Members */}
                        <div className="rounded-2xl border border-border/60 bg-card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Users className="w-4 h-4 text-primary" /> Members ({bubble.agents?.length ?? 0})
                                </div>
                                <button
                                    onClick={() => { setEditMode(e => !e); setRemoveTarget(null); setConfirmName(''); }}
                                    className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer',
                                        editMode ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40')}
                                >
                                    {editMode ? <><X className="w-3 h-3" /> Done</> : <><Pencil className="w-3 h-3" /> Edit</>}
                                </button>
                            </div>
                            {(!bubble.agents || bubble.agents.length === 0) && (
                                <p className="text-xs text-muted-foreground py-2">No agents yet.</p>
                            )}
                            <div className="space-y-1.5">
                                {bubble.agents?.map((a: any) => (
                                    <div key={a._id} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-xs font-medium flex-1 truncate">{a.name}</span>
                                        <button onClick={() => setSubAgent(a)} title="Subscribe to gossip" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                            <Wifi className="w-3.5 h-3.5" />
                                        </button>
                                        {editMode && (
                                            <button
                                                onClick={() => { setRemoveTarget(a); setConfirmName(''); }}
                                                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                                title="Remove agent"
                                            >
                                                <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add agent — only visible in edit mode */}
                        {editMode && nonMembers.length > 0 && (
                            <div className="rounded-2xl border border-border/60 bg-card p-4">
                                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                                    <UserPlus className="w-4 h-4 text-primary" /> Add Agent
                                </div>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {nonMembers.map((a: any) => (
                                        <button key={a._id} onClick={() => addAgent(String(a._id))}
                                            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs hover:bg-accent/40 transition-colors cursor-pointer">
                                            <span className="flex-1 text-left truncate">{a.name}</span>
                                            <span className="text-muted-foreground capitalize">{a.agentType?.replace('_agent','')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit task */}
                        <div className="rounded-2xl border border-border/60 bg-card p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                                <Send className="w-4 h-4 text-primary" /> Submit Task
                            </div>
                            <form onSubmit={handleTask} className="flex gap-2">
                                <input value={taskInput} onChange={e => setTask(e.target.value)}
                                    placeholder="e.g. swap 10 USDT to ETH"
                                    className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <button type="submit" disabled={submitting || !taskInput.trim()}
                                    className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer">
                                    {submitting ? '…' : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </form>
                            <p className="text-[11px] text-muted-foreground mt-2">Routed gossip-style across bubble agents</p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span><span className="font-semibold text-foreground">{bubble.gossipInterval}s</span> interval</span>
                            <span><span className="font-semibold text-foreground">{bubble.fanout}</span> fanout</span>
                            <span><span className="font-semibold text-foreground">{bubble.messageCount ?? 0}</span> msgs</span>
                        </div>
                    </div>

                    {/* Right — flip card: feed ↔ circle packing viz */}
                    <div className={cn('lg:col-span-2 rounded-2xl border border-border/60 bg-card overflow-hidden', feedHeight)}>
                        <FlipCard
                            label="Visualize"
                            className="w-full h-full"
                            front={<GossipFeed bubbleId={id} isActive={bubble.status === 'active'} isInteracting={isInteracting} />}
                            back={<BubbleNetworkViz bubble={bubble} isInteracting={isInteracting} />}
                        />
                    </div>
                </div>
            </div>

            {/* Remove-agent confirmation modal */}
            {removeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setRemoveTarget(null); setConfirmName(''); }} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-sm">Remove agent</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Remove <span className="font-semibold text-foreground">{removeTarget.name}</span> from this bubble?
                                </p>
                            </div>
                            <button onClick={() => { setRemoveTarget(null); setConfirmName(''); }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                            This will remove the agent from all gossip rounds in this bubble.
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">
                                Type <span className="font-semibold text-foreground">{removeTarget.name}</span> to confirm
                            </label>
                            <input
                                autoFocus
                                value={confirmName}
                                onChange={e => setConfirmName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmRemove()}
                                placeholder={removeTarget.name}
                                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
                            />
                        </div>
                        <button
                            onClick={confirmRemove}
                            disabled={confirmName.trim() !== removeTarget.name}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <UserMinus className="w-4 h-4" /> Remove {removeTarget.name}
                        </button>
                    </div>
                </div>
            )}

            <SubscribeModal
                agent={subscribeAgent}
                isOpen={!!subscribeAgent}
                onClose={() => setSubAgent(null)}
                onSubscribed={() => setSubAgent(null)}
            />
        </div>
    );
}
