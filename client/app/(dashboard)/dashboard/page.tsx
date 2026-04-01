'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';
import CreateAgentModal from '@/components/create-agent-modal';
import EditAgentModal from '@/components/edit-agent-modal';
import { UpgradePricingModal } from '@/components/modals/upgrade-pricing-modal';
import { Button } from '@/components/ui/buttons/button';
import {
  Plus,
  Zap,
  Activity,
  Bot,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Coins,
  Sparkles,
  Crown,
  Info,
} from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const planMeta: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: 'bg-muted/60 text-muted-foreground border-border/40' },
  starter:    { label: 'Starter',    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  pro:        { label: 'Pro',        color: 'bg-primary/10 text-primary border-primary/20' },
  max:        { label: 'Max',        color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  unlimited:  { label: 'Unlimited',  color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
};

function PlanBadge({ plan }: { plan: string }) {
  const meta = planMeta[plan] ?? planMeta.free;
  return (
    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-full ${meta.color}`}>
      <Sparkles className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 group hover:border-primary/20 transition-colors duration-200"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.replace('bg-', 'bg-').replace('/60', '/15')}`}>
          <Icon className={`w-4.5 h-4.5 ${accent.includes('primary') ? 'text-primary' : accent.includes('violet') ? 'text-violet-500' : accent.includes('emerald') ? 'text-emerald-500' : 'text-amber-500'}`} />
        </div>
      </div>
      <div className="text-2xl font-extrabold tracking-tight mb-0.5">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/60 mt-1">{sub}</div>}
    </motion.div>
  );
}

function AgentCard({
  agent,
  onEdit,
  index,
}: {
  agent: any;
  onEdit: (a: any) => void;
  index: number;
}) {
  const isPublished = !agent.isDraft;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + index * 0.06, ease }}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${isPublished ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/20' : 'bg-gradient-to-r from-amber-500/60 to-amber-400/20'}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(agent)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
              aria-label="Edit agent"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isPublished
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}
            >
              {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
              {isPublished ? 'Live' : 'Draft'}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-[15px] mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
          {agent.name}
        </h3>
        <p className="text-[13px] text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
          {agent.description || 'No description provided for this agent.'}
        </p>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            {new Date(agent.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <Link href={`/sandbox?agentId=${agent._id}`}>
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer">
              {agent.isDraft ? 'Continue' : 'Open'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<{ plan: string; tokens: number } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    apiFetch('/agents')
      .then(setAgents)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
    apiFetch('/auth/me')
      .then((u) => setUserPlan({ plan: u.plan ?? 'free', tokens: u.tokens ?? 0 }))
      .catch(() => {});
  }, []);

  const handleEditSuccess = (updated: any) =>
    setAgents((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));

  const filtered = agents.filter((a) => {
    if (activeTab === 'published') return !a.isDraft;
    if (activeTab === 'drafts') return a.isDraft;
    return true;
  });

  const published = agents.filter((a) => !a.isDraft).length;
  const drafts = agents.filter((a) => a.isDraft).length;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-7">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Agent Studio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Token balance pill */}
            {userPlan && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-full">
                <Coins className="w-3.5 h-3.5" />
                {userPlan.tokens.toLocaleString()} tokens
              </div>
            )}
            {/* Plan badge */}
            {userPlan && (
              <PlanBadge plan={userPlan.plan} />
            )}
            {/* Upgrade button — shown for free & starter plans */}
            {userPlan && ['free', 'starter'].includes(userPlan.plan) && (
              <button
                onClick={() => setUpgradeOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500/15 to-primary/15 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-full hover:from-amber-500/25 hover:to-primary/25 transition-all cursor-pointer"
              >
                <Crown className="w-3 h-3" />
                Upgrade
              </button>
            )}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Agent
            </Button>
          </div>
        </motion.div>


        {/* Free plan info banner */}
        {userPlan?.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease }}
            className="mb-6 rounded-2xl border border-border/50 bg-muted/20 px-5 py-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Free Plan includes</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3 h-3 text-primary" />
                      Up to <strong className="text-foreground">3 agents</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Max <strong className="text-foreground">5 connected nodes</strong> per agent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-amber-500" />
                      <strong className="text-foreground">50 tokens</strong> per node executed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <strong className="text-foreground">500 tokens</strong> / month
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20 whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade Plan
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard icon={Bot}       label="Total Agents"   value={String(agents.length)}   accent="bg-primary/60"   delay={0}    />
          <StatCard icon={CheckCircle2} label="Published"   value={String(published)}        accent="bg-emerald-500/60" delay={0.05} />
          <StatCard icon={Zap}        label="Drafts"        value={String(drafts)}           accent="bg-amber-500/60" delay={0.1}  />
          <StatCard icon={TrendingUp} label="Executions"    value="—"  sub="Connect API to track" accent="bg-violet-500/60" delay={0.15} />
        </div>

        {/* Tabs + actions */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-0.5 bg-muted/30 p-1 rounded-xl border border-border/40">
            {(['all', 'published', 'drafts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">Loading agents…</span>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
            <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-[15px] mb-1">No agents yet</p>
            <p className="text-sm text-muted-foreground mb-5">
              Create your first AI agent to get started.
            </p>
            <Link href="/sandbox">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors">
                Open Sandbox
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}

        {/* Agent grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent, i) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                index={i}
                onEdit={(a) => { setEditingAgent(a); setIsEditModalOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <CreateAgentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        agent={editingAgent}
        onSuccess={handleEditSuccess}
      />
      <UpgradePricingModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={userPlan?.plan}
      />
    </div>
  );
}
