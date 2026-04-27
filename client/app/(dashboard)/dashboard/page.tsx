'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { financialAgentApi } from '@/api/financial.api';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUXMode } from '@/contexts/UXModeContext';
import CreateAgentModal from '@/components/create-agent-modal';
import { Button } from '@/components/ui/buttons/button';
import { AgentCard } from './components/AgentCard';
import Link from 'next/link';
import {
  Plus, Sparkles, ArrowRight,
  LayoutGrid, List, Search, RefreshCw, X, Bell
} from 'lucide-react';
import { IconActivity, IconChartBar, IconClock, IconCpu, IconShieldCheck, IconWallet } from "@tabler/icons-react";
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type ViewMode = 'grid' | 'list';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: 'primary' | 'violet' | 'emerald' | 'amber';
  delay: number;
}) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20 hover:border-primary/40 shadow-primary/5',
    violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40 shadow-violet-500/5',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-500/5',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 shadow-amber-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease }}
      className={cn(
        "relative group p-5 rounded-2xl border bg-card/50 backdrop-blur-md transition-all duration-300 hover:shadow-2xl",
        colorMap[color]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorMap[color].split(' ')[1])}>
          <Icon className="w-5 h-5" />
        </div>
        {sub && <span className="text-[10px] font-bold text-muted-foreground/60">{sub}</span>}
      </div>
      <div className="space-y-0.5">
        <div className="text-2xl font-black tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">{label}</div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const { activeWorkspace } = useWorkspace();
  const { isLite } = useUXMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const refreshAgents = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const agList = await financialAgentApi.listAgents();
      setAgents(agList);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAgents();
  }, [activeWorkspace]);

  // Handle auto-resumption of agent drafts from landing page
  useEffect(() => {
    if (!activeWorkspace || loading) return;

    const DRAFT_KEY = 'onhandl_agent_draft';
    const checkDraft = async () => {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;

        const draft = JSON.parse(raw);
        if (draft.name && draft.description) {
          // Clear it first to prevent double-creation
          sessionStorage.removeItem(DRAFT_KEY);

          import('sonner').then(({ toast }) => {
            toast.loading(`Resuming creation of ${draft.name}...`);
            financialAgentApi.draftFromPrompt(draft.name, draft.description, 'balanced_allocator')
              .then(data => financialAgentApi.createFromStructured(data))
              .then(() => {
                toast.success(`${draft.name} deployed!`, { description: 'Draft resume successful.' });
                refreshAgents();
              })
              .catch(err => {
                toast.error('Failed to resume draft agent', { description: err.message });
              });
          });
        }
      } catch (err) {
        console.error('Draft resumption error:', err);
      }
    };

    checkDraft();
  }, [activeWorkspace, loading]);

  const filteredAgents = agents.filter((agent) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const searchable = [
      agent.name,
      agent.description,
      agent.status,
      agent.networkConfigs?.[0]?.network,
      agent.networkConfigs?.[0]?.wallet?.address,
      ...(agent.subscribedEvents || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(query);
  });

  const activeAgents = agents.filter(a => a.status === 'active').length;

  const totalAssets = agents.reduce((acc, a) => {
    const bal = a.stateId?.totalNativeAmount || '0';
    return acc + parseFloat(bal);
  }, 0);

  const totalPolicyHits = agents.reduce((acc, a) => {
    return acc + (parseInt(a.stateId?.counters?.totalReceived || '0'));
  }, 0);

  return (
    <div className="min-h-full bg-background selection:bg-primary/20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <IconCpu className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Financial Studio</h1>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  <LayoutGrid className="w-3 h-3" />
                  {activeWorkspace?.name || 'Loading Workspace...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Link
                href="/settings?section=integrations"
                className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40 hover:border-primary/40"
              >
                <Bell className="w-3 h-3 group-hover:animate-bounce" />
                Notifications
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-wrap items-center gap-4"
          >

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={refreshAgents}
                disabled={loading}
                className="rounded-xl border-border/40 hover:bg-muted/50"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                NEW AGENT
              </Button>
            </div>
          </motion.div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={IconCpu} label="Total Agents" value={String(agents.length)} color="primary" delay={0.1} />
          <StatCard icon={IconShieldCheck} label="Active Agents" value={String(activeAgents)} color="emerald" delay={0.2} />
          <StatCard
            icon={IconWallet}
            label="Total Assets"
            value={totalAssets > 0 ? `${totalAssets.toLocaleString()} CKB` : '0.00'}
            sub="CKB Network"
            color="violet"
            delay={0.3}
          />
          <StatCard
            icon={IconChartBar}
            label="Policy Hits"
            value={String(totalPolicyHits)}
            sub="Last 24h"
            color="amber"
            delay={0.4}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search agents, status, network, policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={cn(
                "h-8 rounded-lg text-[11px] font-bold uppercase tracking-widest",
                viewMode === 'grid'
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={cn(
                "h-8 rounded-lg text-[11px] font-bold uppercase tracking-widest",
                viewMode === 'list'
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5 mr-1.5" /> List
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse uppercase tracking-widest">Synchronizing Studio...</p>
            </motion.div>
          ) : filteredAgents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 rounded-3xl border border-dashed border-border/60 bg-muted/5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-50" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                  <IconCpu className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Financial Agents Found</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                  Your workspace is ready for its first autonomous financial agent. Start with a simple prompt.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-xl bg-primary px-8 font-bold text-sm tracking-wide shadow-xl shadow-primary/20"
                >
                  INITIALIZE AGENT
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}
            >
              {viewMode === 'grid'
                ? filteredAgents.map((agent, i) => (
                  <AgentCard
                    key={agent._id}
                    agent={agent}
                    index={i}
                    compact={isLite}
                    onControlChange={(id, status) => setAgents(prev => prev.map(a => a._id === id ? { ...a, status } : a))}
                  />
                ))
                : filteredAgents.map((agent, i) => {
                  const isActive = agent.status === 'active';
                  const network = agent.networkConfigs?.[0]?.network || 'CKB';
                  const policyCount = agent.subscribedEvents?.length || 0;
                  const updatedAt = agent.updatedAt
                    ? new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'New';

                  return (
                    <motion.div
                      key={agent._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="grid gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-sm backdrop-blur-xl transition-colors hover:border-primary/30 md:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] md:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                          isActive
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                        )}>
                          <IconActivity className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 md:max-w-[66%] lg:max-w-none">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-black tracking-tight text-foreground">{agent.name}</h3>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                              isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                            )}>
                              {isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 max-w-full break-words text-xs font-medium leading-relaxed text-muted-foreground md:max-w-[38rem]">
                            {agent.description || 'Managed financial agent'}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-3 gap-3 text-xs md:justify-self-end md:w-full">
                        <div>
                          <p className="font-black uppercase tracking-widest text-muted-foreground/70">Network</p>
                          <p className="mt-1 font-bold">{network}</p>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-widest text-muted-foreground/70">Policies</p>
                          <p className="mt-1 font-bold">{policyCount}</p>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-widest text-muted-foreground/70">Updated</p>
                          <p className="mt-1 flex items-center gap-1 font-bold">
                            <IconClock className="h-3.5 w-3.5 text-muted-foreground" />
                            {updatedAt}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
            {error}
          </div>
        )}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onComplete={() => refreshAgents()}
      />
    </div>
  );
}
