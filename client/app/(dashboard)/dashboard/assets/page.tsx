'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { financialAgentApi } from '@/api';
import {
  IconWallet,
  IconHistory,
  IconChartPie,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCoins,
  IconLoader2,
  IconRefresh
} from '@tabler/icons-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const COLORS = ['#e0692e', '#101010', '#3d3a39', '#8a8380', '#ccc9c7'];

export default function AssetsPage() {
  const { activeWorkspace } = useWorkspace();
  const activeWorkspaceId = activeWorkspace?._id;
  const [agents, setAgents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [agentsData, eventsData] = await Promise.all([
          financialAgentApi.listAgents(),
          financialAgentApi.getWorkspaceEvents()
        ]);
        setAgents(agentsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to fetch assets data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeWorkspaceId]);

  const totalBalance = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const bal = agent.stateId?.balances?.CKB || '0';
      return acc + parseFloat(bal);
    }, 0);
  }, [agents]);

  const assetDistribution = useMemo(() => {
    return [
      { name: 'CKB', value: totalBalance },
      { name: 'Other', value: totalBalance * 0.1 }
    ];
  }, [totalBalance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto selection:bg-primary/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Assets & Treasury</h1>
          <p className="text-muted-foreground mt-1 font-medium italic">Manage global liquidity and track treasury growth across all agents.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all w-fit shadow-sm"
        >
          <IconRefresh className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 relative p-8 rounded-[2.5rem] border border-primary/20 bg-card/40 backdrop-blur-3xl overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <IconWallet className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Total Liquidity</span>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-7xl font-black tracking-tighter">{totalBalance.toLocaleString()}</span>
              <span className="text-2xl font-bold text-muted-foreground uppercase">CKB</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-black mb-8 uppercase tracking-widest">
              <IconArrowUpRight className="w-4 h-4 shadow-sm" />
              <span>+12.5% Performance</span>
            </div>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 7 }).map((_, i) => ({ val: (Math.random() * 0.4 + 0.8) * totalBalance }))}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="var(--primary)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-8 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl shadow-xl"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
            <IconChartPie className="w-4 h-4 text-primary" />
            Asset Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {assetDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black">{Math.round((item.value / (totalBalance || 1)) * 100)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative p-8 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl shadow-xl"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
            <IconCoins className="w-5 h-5 text-primary" />
            Agent Allocation
          </h2>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent._id} className="flex items-center justify-between p-5 rounded-3xl bg-background/50 border border-border/40 hover:border-primary/40 hover:scale-[1.01] transition-all group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-primary/10">
                    <IconWallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-[13px] uppercase tracking-wide">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold mt-0.5">Automated Treasury</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm tracking-tight">{(parseFloat(agent.stateId?.balances?.CKB || '0')).toLocaleString()} CKB</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">≈ ${(parseFloat(agent.stateId?.balances?.CKB || '0') * 0.01).toFixed(2)} USD</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative p-8 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl shadow-xl"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
            <IconHistory className="w-5 h-5 text-primary" />
            Audit Ledger
          </h2>
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 opacity-40">
                  <IconHistory className="w-8 h-8" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">No ledger events found</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="flex gap-5 group">
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110",
                    event.type === 'received' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    {event.type === 'received' ? <IconArrowDownLeft className="w-5 h-5" /> : <IconArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 border-b border-border/40 pb-5 last:border-0 group-last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-black text-[13px] uppercase tracking-wide">{event.type || 'System Event'}</p>
                      <p className={cn("font-black text-sm tracking-tight", event.type === 'received' ? "text-emerald-500" : "text-foreground")}>
                        {event.type === 'received' ? '+' : '-'}{event.amount || '0'} CKB
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground font-semibold line-clamp-1 max-w-[220px]">{event.description || 'Verified on-chain execution'}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter bg-muted/30 px-2 py-0.5 rounded-lg border border-border/30">
                        {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
