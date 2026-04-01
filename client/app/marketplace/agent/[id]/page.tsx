'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { agentApi } from '@/api/agent-api';
import { Button } from '@/components/ui/buttons/button';
import { Badge } from '@/components/ui/feedback/badge';
import { ArrowLeft, Bot, Eye, Star, Loader2, Wallet, Layers, ShieldCheck, ShieldX, User } from 'lucide-react';
import { JsonViewer, ConstraintList } from './components/AgentInfoComponents';
import { PurchaseSidebar } from './components/PurchaseSidebar';
import { ReviewsSection } from './components/ReviewsSection';

export default function MarketplaceAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const [agentId, setAgentId] = useState<string | null>(null);
    const [agent, setAgent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { params.then(({ id }) => setAgentId(id)); }, [params]);
    useEffect(() => {
        if (!agentId) return;
        agentApi.getMarketplaceAgent(agentId)
            .then(setAgent).catch(() => setAgent(null)).finally(() => setIsLoading(false));
    }, [agentId]);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-[#9AB17A]" />
        </div>
    );

    if (!agent) return (
        <div className="flex flex-col h-screen items-center justify-center bg-zinc-950 gap-4">
            <p className="text-zinc-400">Agent not found or not listed on marketplace.</p>
            <Link href="/marketplace"><Button variant="outline">Back to Marketplace</Button></Link>
        </div>
    );

    const mkt = agent?.marketplace || {};
    const char = agent?.character || {};
    const blockchains: { network: string; address?: string }[] = agent?.blockchain || [];

    const allowedActions: string[] = [
        ...(char.financial_profile?.supported_actions || []),
        ...(char.operational_profile?.supported_tasks || []),
        ...(char.social_profile?.supported_platforms?.map((p: string) => `Platform: ${p}`) || []),
    ];
    const notAllowed: string[] = [
        ...(char.constraints?.must_not_do || []),
        ...(char.risk_controls?.forbidden_financial_actions || []),
    ];
    const safetyRules: string[] = char.constraints?.safety_rules || [];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Marketplace
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ── Main info ── */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#9AB17A]/15 flex items-center justify-center border border-[#9AB17A]/25 flex-shrink-0">
                                <Bot className="h-7 w-7 text-[#9AB17A]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{agent.name}</h1>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {mkt.category && (
                                        <Badge className="text-xs bg-[#9AB17A]/10 text-[#9AB17A] border-[#9AB17A]/25">{mkt.category}</Badge>
                                    )}
                                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Eye className="h-3 w-3" /> {mkt.stats?.views || 0} views
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Star className="h-3 w-3" /> {(mkt.stats?.rating || 0).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                            <h2 className="font-semibold mb-2 text-sm">About this agent</h2>
                            <p className="text-sm text-zinc-400 leading-relaxed">{agent.description || 'No description provided.'}</p>
                        </div>

                        {char.character?.bio && (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h2 className="font-semibold mb-2 text-sm">Character</h2>
                                <p className="text-sm text-zinc-400 leading-relaxed italic">{char.character.bio}</p>
                                {char.character?.traits?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {char.character.traits.map((t: string) => (
                                            <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-[#9AB17A]/10 text-[#9AB17A] border border-[#9AB17A]/20 font-medium">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                            <h2 className="font-semibold mb-3 text-sm">Details</h2>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div><dt className="text-xs text-zinc-500 mb-0.5">Type</dt><dd className="font-medium capitalize">{agent.agentType?.replace(/_/g, ' ')}</dd></div>
                                <div><dt className="text-xs text-zinc-500 mb-0.5">Model Provider</dt><dd className="font-medium capitalize">{agent.modelProvider || '—'}</dd></div>
                                <div><dt className="text-xs text-zinc-500 mb-0.5">Purchases</dt><dd className="font-medium">{mkt.stats?.purchases || 0}</dd></div>
                                <div><dt className="text-xs text-zinc-500 mb-0.5">Purpose</dt><dd className="font-medium text-xs leading-snug line-clamp-2">{char.purpose?.primary_goal || '—'}</dd></div>
                            </dl>
                        </div>

                        {blockchains.length > 0 && (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-[#9AB17A]" /> Wallets &amp; Chains
                                </h2>
                                <div className="space-y-2">
                                    {blockchains.map((bc, i) => (
                                        <div key={i} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-3.5 w-3.5 text-[#C3CC9B]" />
                                                <span className="text-xs font-medium text-zinc-300">{bc.network}</span>
                                            </div>
                                            {bc.address && (
                                                <code className="text-[10px] text-zinc-500 font-mono">
                                                    {bc.address.slice(0, 8)}…{bc.address.slice(-6)}
                                                </code>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {allowedActions.length > 0 && (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-[#9AB17A]" /> What this agent can do
                                </h2>
                                <ConstraintList items={allowedActions} allowed={true} />
                            </div>
                        )}

                        {notAllowed.length > 0 && (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                    <ShieldX className="h-4 w-4 text-red-400" /> What this agent will NOT do
                                </h2>
                                <ConstraintList items={notAllowed} allowed={false} />
                                {safetyRules.length > 0 && (
                                    <>
                                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-4 mb-2">Safety Rules</p>
                                        <ConstraintList items={safetyRules} allowed={true} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Creator card */}
                        {agent.creator && (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h2 className="font-semibold mb-3 text-sm">Created by</h2>
                                <Link href={`/creators/${agent.creator._id}`} className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {agent.creator.avatarUrl
                                            ? <img src={agent.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            : <User className="w-5 h-5 text-zinc-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold group-hover:text-[#9AB17A] transition-colors">{agent.creator.name}</p>
                                        {agent.creator.username && <p className="text-xs text-zinc-500">@{agent.creator.username}</p>}
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 ml-auto group-hover:text-[#9AB17A] transition-colors" />
                                </Link>
                                {agent.creator.bio && <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{agent.creator.bio}</p>}
                            </div>
                        )}

                        {/* Reviews */}
                        {agentId && <ReviewsSection agentId={agentId} />}

                        {Object.keys(char).length > 0 && <JsonViewer data={char} label="Full Character JSON" />}
                        {agent.graph && (
                            <JsonViewer
                                data={{ nodes: agent.graph.nodes?.length, edges: agent.graph.edges?.length, preview: 'Use Open in Sandbox to inspect the full graph' }}
                                label="Workflow Graph Info"
                            />
                        )}
                    </div>

                    {/* ── Purchase sidebar ── */}
                    <div className="space-y-4">
                        {agentId && <PurchaseSidebar agentId={agentId} agent={agent} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
