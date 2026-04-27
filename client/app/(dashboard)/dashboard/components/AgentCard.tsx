'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { financialAgentApi } from '@/api/financial.api';
import {
    IconDots, IconArrowRight, IconClock, IconActivity, IconPlayerPause, IconPlayerPlay,
    IconShieldLock, IconDatabase, IconNetwork, IconWallet
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface AgentCardProps {
    agent: any;
    onControlChange?: (id: string, newStatus: string) => void;
    index: number;
    compact?: boolean;
}

export function AgentCard({ agent, onControlChange, index, compact = false }: AgentCardProps) {
    const isActive = agent.status === 'active';
    const network = agent.networkConfigs?.[0]?.network || 'CKB';
    const address = agent.networkConfigs?.[0]?.wallet?.address;
    const [balance, setBalance] = useState<any>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            setIsLoadingBalance(true);
            try {
                const data = await financialAgentApi.getAgentBalance(agent._id);
                setBalance(data);
            } catch (err) {
                console.error('Failed to fetch agent balance:', err);
            } finally {
                setIsLoadingBalance(false);
            }
        };
        fetchBalance();
    }, [agent._id]);

    const handleToggleStatus = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (isActive) {
                await financialAgentApi.pauseAgent(agent._id);
                onControlChange?.(agent._id, 'paused');
            } else {
                await financialAgentApi.activateAgent(agent._id);
                onControlChange?.(agent._id, 'active');
            }
        } catch { /* silent */ }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.06, ease }}
            className="group relative flex flex-col rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/60 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
        >
            {/* Status gradient line */}
            <div className={cn(
                "h-1.5 w-full bg-gradient-to-r transition-all duration-500",
                isActive
                    ? "from-emerald-500/80 via-emerald-400/40 to-transparent"
                    : "from-amber-500/80 via-amber-400/40 to-transparent"
            )} />

            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner",
                            isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            <IconActivity className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn(
                                    "w-2 h-2 rounded-full animate-ping",
                                    isActive ? "bg-emerald-500" : "bg-amber-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                                    {isActive ? 'Active' : 'Paused'}
                                </span>
                            </div>
                            <h3 className="font-black text-[17px] tracking-tight group-hover:text-primary transition-colors duration-300">
                                {agent.name}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleStatus}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
                                isActive
                                    ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            )}
                            title={isActive ? 'Pause Agent' : 'Activate Agent'}
                        >
                            {isActive ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
                        </button>
                    </div>
                </div>

                <p className="text-[14px] text-muted-foreground/80 line-clamp-2 flex-1 leading-relaxed mb-6 font-medium">
                    {agent.description || 'Ensuring financial integrity and autonomous decision making on the network.'}
                </p>

                {compact ? (
                    <div className="pt-5 border-t border-border/40 flex items-center justify-between">
                        <span className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                            isActive
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        )}>
                            <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-500" : "bg-amber-500")} />
                            {isActive ? 'Active' : 'Paused'}
                        </span>
                        <Link
                            href="/bot"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90"
                        >
                            Open Chat
                            <IconArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Metadata tokens */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <IconNetwork size={12} />
                                {network}
                            </div>
                            {agent.subscribedEvents?.length > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <IconShieldLock size={12} />
                                    {agent.subscribedEvents.length} Policies
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest shadow-sm">
                                <IconWallet size={12} />
                                {isLoadingBalance ? '...' : (balance?.totals?.native || '0.00')} {network}
                            </div>
                        </div>

                        {/* Address Pill (if available) */}
                        {address && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[11px] font-mono text-primary/70 mb-6 truncate">
                                <IconDatabase size={14} className="shrink-0" />
                                {address}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-5 border-t border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                <IconClock size={14} />
                                {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Premium hover highlight */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
}
