'use client';

import { useState, useEffect } from 'react';
import { X, Bot, Eye, Star, ShoppingCart, TrendingUp, Calendar, CheckCircle2, Circle, Store, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { apiFetch } from '@/lib/api-client';

interface AgentStats {
  views: number;
  purchases: number;
  revenue: number;
  rating: number;
  chartData: { date: string; purchases: number; revenue: number }[];
}

interface Props { agent: any; onClose: () => void; }

export function AgentDetailPanel({ agent, onClose }: Props) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/agents/${agent._id}/stats`)
      .then((d: any) => setStats(d))
      .catch(() => setStats({ views: 0, purchases: 0, revenue: 0, rating: 0, chartData: [] }))
      .finally(() => setLoading(false));
  }, [agent._id]);

  const mkt = agent.marketplace || {};
  const isPublished = !agent.isDraft;
  const isListed = !!mkt.published;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg h-full bg-card border-l border-border overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border/60 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-[15px] leading-tight">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    isPublished ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                  {isListed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Store className="w-2.5 h-2.5" /> Marketplace
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading stats…</span>
            </div>
          ) : (
            <div className="p-5 space-y-6">
              {agent.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Views',  value: (stats!.views).toLocaleString(),     icon: Eye,          color: 'text-blue-400'    },
                  { label: 'Purchases',    value: stats!.purchases,                      icon: ShoppingCart, color: 'text-emerald-400' },
                  { label: 'Revenue',      value: `$${stats!.revenue.toFixed(2)}`,       icon: TrendingUp,   color: 'text-primary'     },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                    <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />
                    <p className="text-lg font-extrabold">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Purchases chart */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShoppingCart className="w-3 h-3" /> Purchases (Last 30 Days)
                </h3>
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={stats!.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="purchases" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#purchGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue chart */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Revenue USD (Last 30 Days)
                </h3>
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={stats!.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Marketplace info */}
              {isListed && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Store className="w-3 h-3" /> Marketplace Listing
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Category</span><p className="font-medium">{mkt.category || '—'}</p></div>
                    <div><span className="text-muted-foreground text-xs">Pricing</span><p className="font-medium capitalize">{mkt.pricing?.type || 'Free'}</p></div>
                    <div><span className="text-muted-foreground text-xs">Price</span><p className="font-medium">{mkt.pricing?.type === 'paid' ? `${mkt.pricing?.currency} ${mkt.pricing?.price}` : 'Free'}</p></div>
                    <div><span className="text-muted-foreground text-xs">Visibility</span><p className="font-medium capitalize">{mkt.visibility || 'public'}</p></div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 mt-2 border-t border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Eye className="w-3 h-3" />{mkt.stats?.views || 0} views</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{(mkt.stats?.rating || 0).toFixed(1)}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShoppingCart className="w-3 h-3" />{mkt.stats?.purchases || 0}</span>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Created</span><p className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</p></div>
                  <div><span className="text-muted-foreground text-xs">Updated</span><p className="font-medium">{new Date(agent.updatedAt).toLocaleDateString()}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Agent ID</span><p className="font-mono text-[10px] text-muted-foreground">{agent._id}</p></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
