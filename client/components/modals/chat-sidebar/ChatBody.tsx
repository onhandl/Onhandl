'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/data-display/avatar';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import ReactMarkdown from 'react-markdown';
import { mdComponents } from './mdComponents';
import {
    IconX, IconMaximize, IconMinimize, IconSend, IconLoader2,
    IconUser, IconRobot, IconSparkles, IconPlayerPlay,
    IconInfoCircle, IconMessageCircle, IconWallet,
    IconNetwork, IconShieldCheck, IconBan, IconCopy, IconCheck,
} from '@tabler/icons-react';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }

interface ChatBodyProps {
    agent: any;
    messages: Message[];
    isTyping: boolean;
    isFullscreen: boolean;
    input: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    isSimulating: boolean;
    onStartSimulation: () => void;
    onInputChange: (val: string) => void;
    onSend: () => void;
    onToggleFullscreen: () => void;
    onClose: () => void;
}

type Tab = 'chat' | 'details';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={copy} className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Copy">
            {copied ? <IconCheck className="h-3.5 w-3.5 text-emerald-500" /> : <IconCopy className="h-3.5 w-3.5" />}
        </button>
    );
}

function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {icon}{title}
            </div>
            {children}
        </div>
    );
}

function AgentDetails({ agent }: { agent: any }) {
    const char       = agent?.character || {};
    const identity   = char.identity || {};
    const purpose    = char.purpose || {};
    const constraints = char.constraints || {};
    const fp         = char.financial_profile || char.social_profile || char.operational_profile || {};
    const networks   = fp.supported_assets || fp.supported_platforms || [];
    const actions    = fp.supported_actions || fp.supported_tasks || [];
    const blockchain = agent?.blockchain || [];

    return (
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
                {/* Overview */}
                <DetailSection icon={<IconInfoCircle className="h-3.5 w-3.5" />} title="Overview">
                    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">{agent?.name}</p>
                        {identity.role && <p className="text-[11px] text-primary font-medium">{identity.role}</p>}
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                            {agent?.description || identity.description || 'No description available.'}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {agent?.agentType?.replace('_', ' ') || 'Agent'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{agent?.modelProvider}</span>
                        </div>
                    </div>
                </DetailSection>

                {/* Networks */}
                {networks.length > 0 && (
                    <DetailSection icon={<IconNetwork className="h-3.5 w-3.5" />} title="Supported Networks">
                        <div className="flex flex-wrap gap-1.5">
                            {networks.map((n: string) => (
                                <span key={n} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                    {n}
                                </span>
                            ))}
                        </div>
                    </DetailSection>
                )}

                {/* Wallet addresses */}
                {blockchain.length > 0 && (
                    <DetailSection icon={<IconWallet className="h-3.5 w-3.5" />} title="Wallet Addresses">
                        <div className="space-y-1.5">
                            {blockchain.map((w: any, i: number) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{w.chain || w.network}</p>
                                        <p className="text-[11px] font-mono text-foreground truncate max-w-[220px]">{w.address}</p>
                                    </div>
                                    {w.address && <CopyButton text={w.address} />}
                                </div>
                            ))}
                        </div>
                    </DetailSection>
                )}

                {/* Capabilities */}
                {(purpose.primary_goal || (purpose.secondary_goals?.length > 0) || actions.length > 0) && (
                    <DetailSection icon={<IconShieldCheck className="h-3.5 w-3.5" />} title="Capabilities">
                        <div className="space-y-1.5">
                            {purpose.primary_goal && (
                                <div className="flex items-start gap-2 text-[12px] text-foreground">
                                    <span className="text-primary mt-0.5 shrink-0">•</span>
                                    {purpose.primary_goal}
                                </div>
                            )}
                            {purpose.secondary_goals?.map((g: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                                    <span className="text-muted-foreground/50 mt-0.5 shrink-0">–</span>{g}
                                </div>
                            ))}
                            {actions.map((a: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                                    {a.replace(/_/g, ' ')}
                                </div>
                            ))}
                        </div>
                    </DetailSection>
                )}

                {/* Limitations */}
                {(purpose.non_goals?.length > 0 || constraints.must_not_do?.length > 0) && (
                    <DetailSection icon={<IconBan className="h-3.5 w-3.5" />} title="Limitations">
                        <div className="space-y-1.5">
                            {[...(purpose.non_goals || []), ...(constraints.must_not_do || [])].map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                                    <span className="text-destructive mt-0.5 shrink-0">✗</span>{item}
                                </div>
                            ))}
                        </div>
                    </DetailSection>
                )}
            </div>
        </ScrollArea>
    );
}

export function ChatBody({
    agent, messages, isTyping, isFullscreen, input, scrollRef,
    isSimulating, onStartSimulation,
    onInputChange, onSend, onToggleFullscreen, onClose,
}: ChatBodyProps) {
    const [tab, setTab] = useState<Tab>('chat');

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {agent?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground flex items-center gap-1.5 truncate">
                        {agent?.name || 'Agent Chat'}
                        <IconSparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                        {agent?.isDraft ? 'Draft' : 'Live'} · {agent?.modelProvider || 'Ollama'}
                    </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={onToggleFullscreen}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={isFullscreen ? 'Collapse' : 'Expand'}>
                        {isFullscreen ? <IconMinimize className="h-4 w-4" /> : <IconMaximize className="h-4 w-4" />}
                    </button>
                    <button onClick={onClose}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Close">
                        <IconX className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-border shrink-0">
                {(['chat', 'details'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            tab === t
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {t === 'chat'
                            ? <><IconMessageCircle className="h-3.5 w-3.5" />Chat</>
                            : <><IconInfoCircle className="h-3.5 w-3.5" />Details</>}
                    </button>
                ))}
            </div>

            {/* ── Details tab ── */}
            {tab === 'details' && <AgentDetails agent={agent} />}

            {/* ── Chat tab ── */}
            {tab === 'chat' && (
                <>
                    <ScrollArea className="flex-1" ref={scrollRef}>
                        <div className={`p-4 space-y-4 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2.5 ${isFullscreen ? 'max-w-[70%]' : 'max-w-[92%]'} ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
                                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                            <AvatarFallback className={msg.role === 'user' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}>
                                                {msg.role === 'user' ? <IconUser className="h-3.5 w-3.5" /> : <IconRobot className="h-3.5 w-3.5" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed min-w-0 shadow-sm ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-card border border-border text-foreground rounded-tl-none'
                                        }`}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm max-w-none break-words">
                                                    <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="break-words">{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2.5">
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <IconRobot className="h-3.5 w-3.5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="px-3.5 py-2.5 bg-card border border-border rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1 items-center h-4">
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* ── Simulation gate / CTA ── */}
                    {!isSimulating && (
                        <div className="mx-4 mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3 shrink-0">
                            <div>
                                <p className="text-xs font-semibold text-foreground">Simulation not active</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Start simulation to send messages.</p>
                            </div>
                            <Button size="sm" className="h-8 px-3 gap-1.5 shrink-0 text-xs" onClick={onStartSimulation}>
                                <IconPlayerPlay className="h-3.5 w-3.5" />
                                Start Simulation
                            </Button>
                        </div>
                    )}

                    {/* ── Input ── */}
                    <div className={`px-4 pb-4 pt-2 border-t border-border bg-background shrink-0 ${isFullscreen ? 'w-full' : ''}`}>
                        <div className={isFullscreen ? 'max-w-4xl mx-auto' : ''}>
                            <form onSubmit={e => { e.preventDefault(); if (isSimulating) onSend(); }}
                                className="flex gap-2">
                                <Input
                                    placeholder={isSimulating ? 'Type your message…' : 'Start simulation to chat…'}
                                    value={input}
                                    onChange={e => onInputChange(e.target.value)}
                                    disabled={!isSimulating}
                                    className="h-11 bg-card border-border focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <Button type="submit" size="icon"
                                    disabled={isTyping || !input.trim() || !isSimulating}
                                    className="h-11 w-11 shrink-0">
                                    {isTyping
                                        ? <IconLoader2 className="h-4 w-4 animate-spin" />
                                        : <IconSend className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
