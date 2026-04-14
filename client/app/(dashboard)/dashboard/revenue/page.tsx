'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';
import { Input } from '@/components/ui/forms/input';
import {
  Bot, Search, TrendingUp, CheckCircle2, Circle, Store,
  ArrowRight, Clock, Eye, Star, Loader2, ShoppingCart, Crown, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AgentDetailPanel } from './components/AgentDetailPanel';
import { UpgradePricingModal } from '@/components/modals/upgrade-pricing-modal';

type Tab = 'all' | 'published' | 'drafts' | 'listed';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Agents' },
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'listed', label: 'On Marketplace' },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function RevenuePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, published: 0, drafts: 0, listed: 0 });
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebounced] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCounts = useCallback(async () => {
    const [all, published, drafts, listed] = await Promise.all([
      apiFetch('/agents?status=all').catch(() => []),
      apiFetch('/agents?status=published').catch(() => []),
      apiFetch('/agents?status=drafts').catch(() => []),
      apiFetch('/agents?status=listed').catch(() => []),
    ]);
    setCounts({
      all: Array.isArray(all) ? all.length : 0,
      published: Array.isArray(published) ? published.length : 0,
      drafts: Array.isArray(drafts) ? drafts.length : 0,
      listed: Array.isArray(listed) ? listed.length : 0,
    });
  }, []);

  const fetchRevenueOverview = useCallback(async () => {
    apiFetch('/agents/revenue').then(setRevenueData).catch(() => { });
  }, []);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (debouncedQ.trim()) params.set('search', debouncedQ.trim());
      const qs = params.toString();
      const data = await apiFetch(`/agents${qs ? `?${qs}` : ''}`);
      setAgents(Array.isArray(data) ? data : []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedQ]);

  useEffect(() => { fetchCounts(); fetchRevenueOverview(); }, [fetchCounts, fetchRevenueOverview]);
  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch('');
  };

  // Build combined chart data: group chartData from revenue endpoint by date
  const combinedChart = (revenueData?.chartData || []).map((d: any) => ({
    date: d.date,
    Revenue: d.revenue,
    Purchases: d.purchases,
  }));

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-7">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Revenue & Agents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track performance and manage your published agents</p>
          </div>
        </motion.div>

        {/* Top stats: views / revenue / calls / upgrade */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Views', value: (revenueData?.totalViews ?? 0).toLocaleString(), icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Total Revenue', value: `$${(revenueData?.totalRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Total Purchases', value: (revenueData?.totalPurchases ?? 0).toLocaleString(), icon: ShoppingCart, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Upgrade Plan', value: 'Unlock more', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', action: () => setUpgradeOpen(true) },
          ].map(({ label, value, icon: Icon, color, bg, action }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease }}
              onClick={action}
              className={`rounded-2xl border bg-card p-5 ${action ? 'cursor-pointer hover:border-amber-500/30' : ''} border-border/60`}
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <p className="text-xl font-extrabold leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              {action && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 mt-1">
                  <Zap className="w-2.5 h-2.5" /> Upgrade now
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Combined all-agents chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease }}
          className="rounded-2xl border border-border/60 bg-card p-5 mb-7"
        >
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            All Agents — Combined Performance (Last 30 Days)
          </h2>
          {combinedChart.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No data yet — publish agents to the marketplace to track performance.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={combinedChart} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="Purchases" stroke="#8b5cf6" strokeWidth={2} fill="url(#purchGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Search + Tabs with count badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search agents…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border/60 text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex gap-0.5 bg-muted/30 p-1 rounded-xl border border-border/40 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => handleTabChange(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === key
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title={`${counts[key]} agents`}
              >
                {label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1 ${activeTab === key ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
                  }`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading agents…</span>
          </div>
        )}

        {!loading && agents.length === 0 && (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
            <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-[15px] mb-1">No agents found</p>
            <p className="text-sm text-muted-foreground">
              {debouncedQ ? 'Try a different search term.' : 'No agents in this category yet.'}
            </p>
          </div>
        )}

        {!loading && agents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => {
              const isPublished = !agent.isDraft;
              const isListed = !!agent.marketplace?.published;
              const mkt = agent.marketplace || {};
              return (
                <motion.div key={agent._id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease }}
                  onClick={() => setSelected(agent)}
                  className="group relative flex flex-col rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 overflow-hidden cursor-pointer"
                >
                  <div className={`h-0.5 w-full ${isPublished ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/20' : 'bg-gradient-to-r from-amber-500/60 to-amber-400/20'}`} />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isListed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Store className="w-2.5 h-2.5" /> Listed
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isPublished ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                          {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                          {isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-[15px] mb-1.5 group-hover:text-primary transition-colors line-clamp-1">{agent.name}</h3>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 flex-1 leading-relaxed">{agent.description || 'No description.'}</p>
                    {isListed && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="w-3 h-3" />{mkt.stats?.views || 0}</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{(mkt.stats?.rating || 0).toFixed(1)}</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          {mkt.pricing?.type === 'paid' ? `${mkt.pricing?.currency} ${mkt.pricing?.price}` : 'Free'}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <Clock className="w-3 h-3" />
                        {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        View Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <AgentDetailPanel agent={selected} onClose={() => setSelected(null)} />}
      <UpgradePricingModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
