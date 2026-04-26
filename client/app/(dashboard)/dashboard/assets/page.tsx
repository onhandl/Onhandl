'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { financialAgentApi } from '@/api/financial-agent-api';
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
    // For now everything is CKB, but let's mock it for the chart
    return [
      { name: 'CKB', value: totalBalance },
      { name: 'Other', value: totalBalance * 0.1 } // Mock some other asset
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
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Assets & Treasury</h1>
          <p className="text-muted-foreground mt-1">Manage global liquidity and track treasury growth across all agents.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all w-fit"
        >
          <IconRefresh className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Total Wealth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group border-primary/20"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <IconWallet className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary/80">Total Liquidity</span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-6xl font-black tracking-tighter">{totalBalance.toLocaleString()}</span>
              <span className="text-2xl font-bold text-muted-foreground">CKB</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold mb-8">
              <IconArrowUpRight className="w-4 h-4" />
              <span>+12.5% from last month</span>
            </div>

            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 7 }).map((_, i) => ({ val: Math.random() * totalBalance }))}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="var(--primary)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Distribution Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 border-border/40"
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <IconChartPie className="w-5 h-5 text-primary" />
            Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {assetDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{Math.round((item.value / (totalBalance || 1)) * 100)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Agents Breakdown & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agent Balances */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-3xl p-8 border-border/40"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <IconCoins className="w-6 h-6 text-primary" />
            Agent Breakdown
          </h2>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent._id} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10">
                    <IconWallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Managed Wallet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{(parseFloat(agent.stateId?.balances?.CKB || '0')).toLocaleString()} CKB</p>
                  {/* Mock price in USD */}
                  <p className="text-[10px] text-muted-foreground font-bold">≈ ${(parseFloat(agent.stateId?.balances?.CKB || '0') * 0.01).toFixed(2)} USD</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-3xl p-8 border-border/40"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <IconHistory className="w-6 h-6 text-primary" />
            Recent Activity
          </h2>
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <IconHistory className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No recent activity detected.</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="flex gap-4 group">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                    event.type === 'received' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    {event.type === 'received' ? <IconArrowDownLeft className="w-5 h-5" /> : <IconArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 border-b border-border/40 pb-4 group-last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm capitalize">{event.type || 'Transaction'}</p>
                      <p className={cn("font-black text-sm", event.type === 'received' ? "text-emerald-500" : "text-foreground")}>
                        {event.type === 'received' ? '+' : '-'}{event.amount || '0'} CKB
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.description || 'System processed event'}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
