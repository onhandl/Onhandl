'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { agentControlApi } from '@/api/agent-api';
import {
    IconFriends, IconCircleDashedCheck, IconSubtitlesEdit,
    IconPlayerPlay, IconPlayerStop, IconDots, IconArrowRight, IconClock,
} from '@tabler/icons-react';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface AgentCardProps {
    agent: any;
    onEdit: (a: any) => void;
    onControlChange?: (id: string, newStatus: 'running' | 'stopped') => void;
    index: number;
}

export function AgentCard({ agent, onEdit, onControlChange, index }: AgentCardProps) {
    const isPublished = !agent.isDraft;
    const isRunning = agent.status === 'running';

    const handleControl = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            if (isRunning) await agentControlApi.stop(agent._id);
            else await agentControlApi.start(agent._id);
            onControlChange?.(agent._id, isRunning ? 'stopped' : 'running');
        } catch { /* silent */ }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + index * 0.06, ease }}
            className="group relative flex flex-col rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer"
        >
            {/* Status bar */}
            <div className={`h-0.5 w-full ${isPublished
                ? 'bg-gradient-to-r from-emerald-500/70 to-emerald-400/20'
                : 'bg-gradient-to-r from-amber-500/70 to-amber-400/20'}`}
            />

            <div className="p-5 flex flex-col flex-1">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300"
                        onClick={() => onEdit(agent)}
                        title="View details"
                    >
                        <IconFriends className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Run / Stop */}
                        <button
                            onClick={handleControl}
                            title={isRunning ? 'Stop agent' : 'Start agent'}
                            disabled={!isPublished}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-accent/60 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isRunning
                                ? <IconPlayerStop className="w-3.5 h-3.5 text-destructive" />
                                : <IconPlayerPlay className={`w-3.5 h-3.5 ${isPublished ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />}
                        </button>

                        {/* Edit menu */}
                        <button
                            onClick={() => onEdit(agent)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                        >
                            <IconDots className="w-4 h-4" />
                        </button>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isPublished
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                            {isPublished
                                ? <IconCircleDashedCheck className="w-3.5 h-3.5" />
                                : <IconSubtitlesEdit className="w-3.5 h-3.5" />}
                            {isPublished ? 'Live' : 'Draft'}
                        </span>
                    </div>
                </div>

                {/* Name + description */}
                <h3 className="font-bold text-[15px] mb-1.5 group-hover:text-primary transition-colors duration-200 line-clamp-1">
                    {agent.name}
                </h3>
                <p className="text-[13px] text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                    {agent.description || 'No description provided for this agent.'}
                </p>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <IconClock className="w-3 h-3" />
                        {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <Link href={`/sandbox?agentId=${agent._id}`}>
                        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 group-hover:gap-2.5 transition-all duration-200">
                            {agent.isDraft ? 'Continue' : 'Open'}
                            <IconArrowRight className="w-3 h-3" />
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
