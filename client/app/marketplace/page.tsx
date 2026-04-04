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
    IconSearch, IconStar, IconEye, IconShoppingCart, IconLoader2, IconRobot,
    IconTrendingUp, IconPackage, IconFilter, IconUser, IconBolt,
} from '@tabler/icons-react';
import { Navigation } from '@/components/landing/navigation';

const CATEGORIES     = ['All', 'Trading Bot', 'Analytics', 'DeFi Assistant', 'Portfolio Manager', 'Data Feed', 'Custom'];
const NETWORKS       = ['All', 'Ethereum', 'CKB', 'Solana', 'Polygon'];
const PRICING_FILTERS = [
  { label: 'All',  value: 'all'  },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Agent Card ────────────────────────────────────────────────────
function AgentCard({ agent, index }: { agent: any; index: number }) {
  const router   = useRouter();
  const mkt      = agent.marketplace || {};
  const isFree   = mkt.pricing?.type !== 'paid';
  const price    = mkt.pricing?.price;
  const currency = mkt.pricing?.currency || 'USD';
  const category = mkt.category || 'Custom';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease }}
    >
      <div
        onClick={() => router.push(`/marketplace/agent/${agent._id}`)}
        className="group flex flex-col border border-fl-line bg-fl-surface hover:bg-fl-surface-2 hover:border-fl-line-2 transition-all duration-200 overflow-hidden cursor-pointer rounded-lg"
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-fl-accent w-0 group-hover:w-full transition-all duration-300" />

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg border border-fl-line bg-fl-base flex items-center justify-center group-hover:border-fl-accent/40 transition-colors">
              <IconRobot className="h-5 w-5 text-fl-ink-2 group-hover:text-fl-accent transition-colors" />
            </div>
            <Badge className="text-[10px] border border-fl-line bg-fl-base text-fl-ink-3 font-normal rounded-[4px]">
              {category}
            </Badge>
          </div>

          <h3 className="text-[14px] font-normal leading-tight line-clamp-1 mb-1.5 text-fl-ink group-hover:text-fl-accent transition-colors">
            {agent.name}
          </h3>
          <p className="text-[13px] text-fl-ink-3 line-clamp-2 flex-1 leading-relaxed">
            {agent.description || 'No description provided.'}
          </p>

          {agent.creator && (
            <Link
              href={`/creators/${agent.creator._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 mt-3 w-fit group/creator"
            >
              <div className="w-5 h-5 rounded-full border border-fl-line bg-fl-base flex items-center justify-center overflow-hidden shrink-0">
                {agent.creator.avatarUrl
                  ? <img src={agent.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <IconUser className="w-3 h-3 text-fl-ink-3" />}
              </div>
              <span className="text-[11px] text-fl-ink-3 group-hover/creator:text-fl-accent transition-colors truncate">
                {agent.creator.name}
              </span>
            </Link>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[12px] text-fl-ink-3">
              <span className="flex items-center gap-1">
                <IconEye className="h-3 w-3" /> {mkt.stats?.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <IconStar className="h-3 w-3 fill-fl-accent text-fl-accent" />
                {(mkt.stats?.rating || 0).toFixed(1)}
              </span>
            </div>
            <span className={`text-[13px] font-medium ${isFree ? 'text-fl-accent' : 'text-fl-ink'}`}>
              {isFree ? 'Free' : `${currency} ${price}`}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/marketplace/agent/${agent._id}`); }}
            className="btn-fl-primary mt-4 w-full text-[12px] h-9"
          >
            <IconShoppingCart className="h-3.5 w-3.5" />
            {isFree ? 'Use Agent' : 'Buy Agent'}
          </button>
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
        search:   search   || undefined,
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
    <div className="min-h-screen bg-fl-base text-fl-ink">
      <Navigation />

      {/* ── Hero banner ── */}
      <div className="border-b border-fl-line pt-14">
        <div className="max-w-[1400px] mx-auto px-9 py-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6"
          >
            <div>
              <p className="label-factory mb-3 flex items-center gap-2">
                <IconPackage className="w-3 h-3" /> Agent Marketplace
              </p>
              <h1 className="text-[40px] md:text-[52px] font-normal tracking-factory-h2 leading-none text-fl-ink mb-2">
                Discover AI Agents
              </h1>
              <p className="text-[14px] text-fl-ink-3">
                {total} agents published across DeFi, analytics, trading, and more
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-[12px] text-fl-ink-3 pr-4 border-r border-fl-line">
                <span className="flex items-center gap-1.5">
                  <IconTrendingUp className="w-3.5 h-3.5 text-fl-accent" /> {total} Agents
                </span>
                <span className="flex items-center gap-1.5">
                  <IconStar className="w-3.5 h-3.5 fill-fl-accent text-fl-accent" /> Top Rated
                </span>
              </div>
              <Link href="/sandbox">
                <button className="btn-fl-accent text-[13px]">
                  <IconBolt className="h-3.5 w-3.5" /> Build Your Own
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-9 py-8">

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fl-ink-3" />
            <Input
              placeholder="Search agents…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-fl-surface border-fl-line text-[13px] text-fl-ink placeholder:text-fl-ink-3 focus-visible:ring-fl-accent/40 rounded-[4px]"
            />
          </div>

          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-fl-surface border-fl-line text-[13px] text-fl-ink-2 rounded-[4px]">
              <IconFilter className="w-3.5 h-3.5 mr-1.5 text-fl-ink-3" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-fl-surface border-fl-line rounded-[4px]">
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="text-[13px] text-fl-ink-2">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={network} onValueChange={(v) => { setNetwork(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-fl-surface border-fl-line text-[13px] text-fl-ink-2 rounded-[4px]">
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent className="bg-fl-surface border-fl-line rounded-[4px]">
              {NETWORKS.map(n => (
                <SelectItem key={n} value={n} className="text-[13px] text-fl-ink-2">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pricing toggle */}
          <div className="flex border border-fl-line rounded-[4px] overflow-hidden">
            {PRICING_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setPricing(f.value); setPage(1); }}
                className={`px-4 py-2 text-[12px] transition-all cursor-pointer ${
                  pricing === f.value
                    ? 'bg-fl-dark text-fl-ink-inv'
                    : 'bg-fl-surface text-fl-ink-3 hover:text-fl-ink'
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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-3">
              <IconLoader2 className="h-6 w-6 animate-spin text-fl-accent" />
              <p className="text-[13px] text-fl-ink-3">Fetching agents…</p>
            </motion.div>
          ) : agents.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-24 border border-dashed border-fl-line rounded-lg">
              <div className="w-12 h-12 rounded-lg border border-fl-line bg-fl-surface flex items-center justify-center mx-auto mb-4">
                <IconRobot className="h-6 w-6 text-fl-ink-3" />
              </div>
              <p className="text-fl-ink font-normal mb-1 text-[15px]">No agents found</p>
              <p className="text-[13px] text-fl-ink-3">Try adjusting your filters or search term.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-fl-line">
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
              className="btn-fl-outline text-[12px] h-8 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-[12px] text-fl-ink-3">
              Page {page} of {Math.ceil(total / 18)}
            </span>
            <button
              disabled={page >= Math.ceil(total / 18)}
              onClick={() => setPage(page + 1)}
              className="btn-fl-outline text-[12px] h-8 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
