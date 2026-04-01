'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { ArrowLeft, Bot, Eye, Star, ShoppingCart, User, Calendar, BarChart2, Loader2 } from 'lucide-react';

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { params.then(({ id }) => setCreatorId(id)); }, [params]);

  useEffect(() => {
    if (!creatorId) return;
    apiFetch(`/creators/${creatorId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [creatorId]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <Loader2 className="h-8 w-8 animate-spin text-[#9AB17A]" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col h-screen items-center justify-center bg-zinc-950 gap-4">
      <p className="text-zinc-400">Creator not found.</p>
      <Link href="/marketplace" className="text-sm text-[#9AB17A] hover:underline">Back to Marketplace</Link>
    </div>
  );

  const { creator, stats, agents } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Marketplace
        </Link>

        {/* Creator header */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 mb-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {creator.avatarUrl
              ? <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-zinc-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{creator.name}</h1>
            {creator.username && <p className="text-sm text-zinc-500 mt-0.5">@{creator.username}</p>}
            {creator.bio && <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{creator.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {new Date(creator.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{creator.profileViews.toLocaleString()} profile views</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Agents',     value: stats.totalAgents,                     icon: Bot,          color: 'text-[#9AB17A]' },
            { label: 'Total Views',value: stats.totalViews.toLocaleString(),      icon: Eye,          color: 'text-blue-400'  },
            { label: 'Purchases',  value: stats.totalPurchases.toLocaleString(),  icon: ShoppingCart, color: 'text-emerald-400'},
            { label: 'Avg Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—', icon: Star, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-2 ${color}`} />
              <p className="text-lg font-extrabold">{value}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Published Agents ({agents.length})
          </h2>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-10">No public agents yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => {
                const mkt    = agent.marketplace || {};
                const isFree = mkt.pricing?.type !== 'paid';
                return (
                  <Link key={agent._id} href={`/marketplace/agent/${agent._id}`}>
                    <div className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-[#9AB17A]/40 hover:bg-zinc-900 transition-all duration-200 overflow-hidden h-full">
                      <div className="h-0.5 bg-gradient-to-r from-[#9AB17A]/80 to-[#C3CC9B]/20" />
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-[#9AB17A]/15 flex items-center justify-center border border-[#9AB17A]/20">
                            <Bot className="h-4.5 w-4.5 text-[#9AB17A]" />
                          </div>
                          <span className={`text-xs font-bold ${isFree ? 'text-emerald-400' : 'text-[#9AB17A]'}`}>
                            {isFree ? 'Free' : `${mkt.pricing?.currency} ${mkt.pricing?.price}`}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-[#C3CC9B] transition-colors line-clamp-1 mb-1">{agent.name}</h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 flex-1">{agent.description || 'No description.'}</p>
                        <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-600">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{mkt.stats?.views || 0}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{(mkt.stats?.rating || 0).toFixed(1)}</span>
                          <span className="flex items-center gap-1 ml-auto"><ShoppingCart className="w-3 h-3" />{mkt.stats?.purchases || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
