'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { agentApi } from '@/api/agent-api';
import { Input } from '@/components/ui/forms/input';
import { Button } from '@/components/ui/buttons/button';
import { Badge } from '@/components/ui/feedback/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/selection/select';
import {
  Search, Star, Eye, ShoppingCart, Loader2, Bot, Zap,
  TrendingUp, Package, Filter, User,
} from 'lucide-react';
import { Navigation } from '@/components/landing/navigation';

const CATEGORIES = ['All', 'Trading Bot', 'Analytics', 'DeFi Assistant', 'Portfolio Manager', 'Data Feed', 'Custom'];
const NETWORKS   = ['All', 'Ethereum', 'CKB', 'Solana', 'Polygon'];
const PRICING_FILTERS = [
  { label: 'All',  value: 'all'  },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
];

const CATEGORY_META: Record<string, { color: string; dim: string }> = {
  'Trading Bot':        { color: 'text-blue-400',    dim: 'bg-blue-500/10 border-blue-500/20'    },
  Analytics:            { color: 'text-emerald-400', dim: 'bg-emerald-500/10 border-emerald-500/20' },
  'DeFi Assistant':     { color: 'text-[#9AB17A]',  dim: 'bg-[#9AB17A]/10 border-[#9AB17A]/20' },
  'Portfolio Manager':  { color: 'text-orange-400',  dim: 'bg-orange-500/10 border-orange-500/20' },
  'Data Feed':          { color: 'text-cyan-400',    dim: 'bg-cyan-500/10 border-cyan-500/20'    },
  Custom:               { color: 'text-zinc-400',    dim: 'bg-zinc-500/10 border-zinc-500/20'    },
};

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Agent Card ────────────────────────────────────────────────────
function AgentCard({ agent, index }: { agent: any; index: number }) {
  const router   = useRouter();
  const mkt      = agent.marketplace || {};
  const isFree   = mkt.pricing?.type !== 'paid';
  const price    = mkt.pricing?.price;
  const currency = mkt.pricing?.currency || 'USD';
  const category = mkt.category || 'Custom';
  const meta     = CATEGORY_META[category] || CATEGORY_META.Custom;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease }}
    >
      <div
        onClick={() => router.push(`/marketplace/agent/${agent._id}`)}
        className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-[#9AB17A]/40 hover:bg-zinc-900 transition-all duration-200 overflow-hidden cursor-pointer"
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-[#9AB17A]/80 to-[#C3CC9B]/20" />

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9AB17A]/20 to-[#C3CC9B]/10 border border-[#9AB17A]/20 flex items-center justify-center group-hover:from-[#9AB17A]/30 transition-all duration-200">
              <Bot className="h-5 w-5 text-[#9AB17A]" />
            </div>
            <Badge className={`text-[10px] border font-semibold ${meta.dim} ${meta.color}`}>
              {category}
            </Badge>
          </div>

          <h3 className="font-semibold text-sm leading-tight line-clamp-1 mb-1.5 group-hover:text-[#C3CC9B] transition-colors text-zinc-100">
            {agent.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 flex-1 leading-relaxed">
            {agent.description || 'No description provided.'}
          </p>

          {/* Creator — standalone <a>, no longer nested inside another <a> */}
          {agent.creator && (
            <Link
              href={`/creators/${agent.creator._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 mt-3 group/creator w-fit"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {agent.creator.avatarUrl
                  ? <img src={agent.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <User className="w-3 h-3 text-zinc-400" />}
              </div>
              <span className="text-[11px] text-zinc-500 group-hover/creator:text-[#9AB17A] transition-colors truncate">
                {agent.creator.name}
              </span>
            </Link>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                {mkt.stats?.views || 0}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {(mkt.stats?.rating || 0).toFixed(1)}
              </span>
            </div>
            <span className={`text-sm font-bold ${isFree ? 'text-emerald-400' : 'text-[#9AB17A]'}`}>
              {isFree ? 'Free' : `${currency} ${price}`}
            </span>
          </div>

          <Button
            size="sm"
            className="mt-3 w-full bg-[#9AB17A]/15 hover:bg-[#9AB17A] border border-[#9AB17A]/25 text-[#C3CC9B] hover:text-black text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {isFree ? 'Use Agent' : 'Buy Agent'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [agents,    setAgents]   = useState<any[]>([]);
  const [total,     setTotal]    = useState(0);
  const [isLoading, setLoading]  = useState(true);
  const [search,    setSearch]   = useState('');
  const [category,  setCategory] = useState('All');
  const [network,   setNetwork]  = useState('All');
  const [pricing,   setPricing]  = useState('all');
  const [page,      setPage]     = useState(1);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentApi.getMarketplace({
        search:   search || undefined,
        category: category !== 'All' ? category : undefined,
        network:  network  !== 'All' ? network  : undefined,
        pricing:  pricing  !== 'all' ? (pricing as any) : undefined,
        page,
        limit: 18,
      });
      setAgents(data.agents);
      setTotal(data.total);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, network, pricing, page]);

  useEffect(() => {
    const t = setTimeout(fetchAgents, 300);
    return () => clearTimeout(t);
  }, [fetchAgents]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navigation />

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden border-b border-zinc-800/60 pt-20">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#9AB17A]/10 blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-5 py-10 relative">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9AB17A]/30 bg-[#9AB17A]/8 text-xs font-semibold text-[#9AB17A]">
                  <Package className="w-3 h-3" />
                  Agent Marketplace
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                Discover AI Agents
              </h1>
              <p className="text-sm text-zinc-400">
                {total} agents published across DeFi, analytics, trading, and more
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 pr-4 border-r border-zinc-800">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#9AB17A]" />
                  {total} Agents
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Top Rated
                </span>
              </div>
              <Link href="/sandbox">
                <Button size="sm" className="bg-[#9AB17A] hover:bg-[#C3CC9B] text-black shadow-md shadow-[#9AB17A]/25 cursor-pointer">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Build Your Own
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-6">

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="flex flex-wrap gap-3 mb-7"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              placeholder="Search agents…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-zinc-900 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#9AB17A]/40"
            />
          </div>

          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-zinc-900 border-zinc-800 text-sm text-zinc-300">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-zinc-300">{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={network} onValueChange={(v) => { setNetwork(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-sm text-zinc-300">
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {NETWORKS.map((n) => <SelectItem key={n} value={n} className="text-zinc-300">{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
            {PRICING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setPricing(f.value); setPage(1); }}
                className={`px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  pricing === f.value
                    ? 'bg-[#9AB17A] text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Grid ── */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-3"
            >
              <Loader2 className="h-7 w-7 animate-spin text-[#9AB17A]" />
              <p className="text-sm text-zinc-500">Fetching agents…</p>
            </motion.div>
          ) : agents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#9AB17A]/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-[#9AB17A]" />
              </div>
              <p className="text-zinc-300 font-semibold mb-1">No agents found</p>
              <p className="text-sm text-zinc-500">Try adjusting your filters or search term.</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {agents.map((agent, i) => (
                <AgentCard key={agent._id} agent={agent} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ── */}
        {total > 18 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500">
              Page {page} of {Math.ceil(total / 18)}
            </span>
            <button
              disabled={page >= Math.ceil(total / 18)}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
