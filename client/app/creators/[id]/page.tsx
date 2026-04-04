'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import {
    IconArrowLeft, IconRobot, IconEye, IconStar, IconShoppingCart,
    IconUser, IconCalendar, IconChartBar, IconLoader2,
} from '@tabler/icons-react';

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
    <div className="flex h-screen items-center justify-center bg-background">
      <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
      <p className="text-muted-foreground">Creator not found.</p>
      <Link href="/marketplace" className="text-sm text-primary hover:underline">Back to Marketplace</Link>
    </div>
  );

  const { creator, stats, agents } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <IconArrowLeft className="h-4 w-4" /> Marketplace
        </Link>

        {/* Creator header */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {creator.avatarUrl
              ? <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
              : <IconUser className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{creator.name}</h1>
            {creator.username && <p className="text-sm text-muted-foreground mt-0.5">@{creator.username}</p>}
            {creator.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{creator.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <IconCalendar className="w-3 h-3" />
                Joined {new Date(creator.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <IconEye className="w-3 h-3" />
                {creator.profileViews.toLocaleString()} profile views
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Agents',      value: stats.totalAgents,                                          Icon: IconRobot,        color: 'text-primary'    },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(),                          Icon: IconEye,          color: 'text-blue-500'   },
            { label: 'Purchases',   value: stats.totalPurchases.toLocaleString(),                      Icon: IconShoppingCart, color: 'text-emerald-500'},
            { label: 'Avg Rating',  value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',   Icon: IconStar,         color: 'text-amber-500'  },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-2 ${color}`} />
              <p className="text-lg font-extrabold">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <IconChartBar className="w-4 h-4" /> Published Agents ({agents.length})
          </h2>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No public agents yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => {
                const mkt    = agent.marketplace || {};
                const isFree = mkt.pricing?.type !== 'paid';
                return (
                  <Link key={agent._id} href={`/marketplace/agent/${agent._id}`}>
                    <div className="group flex flex-col rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden h-full">
                      <div className="h-0.5 bg-gradient-to-r from-primary/70 to-primary/10" />
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <IconRobot className="h-4 w-4 text-primary" />
                          </div>
                          <span className={`text-xs font-bold ${isFree ? 'text-emerald-600' : 'text-primary'}`}>
                            {isFree ? 'Free' : `${mkt.pricing?.currency} ${mkt.pricing?.price}`}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{agent.description || 'No description.'}</p>
                        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><IconEye className="w-3 h-3" />{mkt.stats?.views || 0}</span>
                          <span className="flex items-center gap-1"><IconStar className="w-3 h-3 fill-amber-400 text-amber-400" />{(mkt.stats?.rating || 0).toFixed(1)}</span>
                          <span className="flex items-center gap-1 ml-auto"><IconShoppingCart className="w-3 h-3" />{mkt.stats?.purchases || 0}</span>
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
