'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import CreateAgentModal from '@/components/create-agent-modal';
import EditAgentModal from '@/components/edit-agent-modal';
import { Button } from '@/components/ui/buttons/button';
import { Plus, Settings } from 'lucide-react';

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await apiFetch('/agents');
        setAgents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  const handleEditClick = (agent: any) => {
    setEditingAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedAgent: any) => {
    setAgents(prev => prev.map(a => a._id === updatedAgent._id ? updatedAgent : a));
  };

  const filteredAgents = agents.filter(agent => {
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return !agent.isDraft;
    if (activeTab === 'drafts') return agent.isDraft;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Agent Studio</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your AI agents and workflows.</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-full bg-primary px-6 py-6 text-sm font-bold text-white hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 flex gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Agent
        </Button>
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        agent={editingAgent}
        onSuccess={handleEditSuccess}
      />

      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit mb-8 border border-border/50">
        {(['all', 'published', 'drafts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${activeTab === tab
              ? 'bg-card text-primary shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm font-medium text-muted-foreground">Loading agents...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8 flex items-center gap-3">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {!loading && filteredAgents.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-muted rounded-2xl bg-muted/5">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-muted-foreground font-medium">No {activeTab === 'all' ? '' : activeTab} agents found.</p>
          <Link href="/sandbox" className="text-primary text-sm font-bold mt-2 inline-block hover:underline">
            Start building one now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => (
          <div key={agent._id} className="group relative flex flex-col bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleEditClick(agent)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${agent.isDraft
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  {agent.isDraft ? 'Draft' : 'Published'}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{agent.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
              {agent.description || 'No description provided for this agent.'}
            </p>

            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Updated</span>
                <span className="text-xs font-medium">{new Date(agent.updatedAt).toLocaleDateString()}</span>
              </div>

              <Link href={`/sandbox?agentId=${agent._id}`}>
                <button className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition-all duration-200">
                  {agent.isDraft ? 'Continue Building' : 'View Graph'}
                  <span className="text-lg">→</span>
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
