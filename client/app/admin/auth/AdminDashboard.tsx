'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Users, Bot, Headphones, FileText, Shield, Zap } from 'lucide-react';
import { UsersTab } from './components/UsersTab';
import { AgentsTab } from './components/AgentsTab';
import { SupportTab } from './components/SupportTab';
import { BlogAdminTab } from './components/BlogAdminTab';

type MainTab = 'users' | 'agents' | 'support' | 'blog';
type AgentSubTab = 'agents' | 'drafts' | 'executions';

const tabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'blog', label: 'Blog', icon: FileText },
];

export function AdminDashboard({ users, agents, drafts, executions, tickets, allPosts, cmsSettings }: {
  users: any[];
  agents: any[];
  drafts: any[];
  executions: any[];
  tickets: any[];
  allPosts: any[];
  cmsSettings: { cmsFrozen: boolean; reason?: string };
}) {
  const [activeTab, setActiveTab] = useState<MainTab>('users');
  const [agentSubTab, setAgentSubTab] = useState<AgentSubTab>('agents');

  const stats = [
    { label: 'Total Users', value: users.length, color: 'text-blue-400' },
    { label: 'Published Agents', value: agents.length, color: 'text-emerald-400' },
    { label: 'Open Tickets', value: tickets.filter((t: any) => t.status === 'open').length, color: 'text-yellow-400' },
    { label: 'Blog Posts', value: allPosts.length, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-bold text-sm">Onhandl</span>
            <span className="text-border/80 text-sm">/</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-primary">Admin</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
          <div className="flex border-b border-border/60 bg-background/50">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'users' && <UsersTab users={users} />}
            {activeTab === 'agents' && (
              <AgentsTab
                agents={agents}
                drafts={drafts}
                executions={executions}
                activeTab={agentSubTab}
                setActiveTab={setAgentSubTab}
              />
            )}
            {activeTab === 'support' && <SupportTab tickets={tickets} />}
            {activeTab === 'blog' && <BlogAdminTab posts={allPosts} cmsSettings={cmsSettings} />}
          </div>
        </div>
      </main>
    </div>
  );
}
