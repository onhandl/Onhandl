'use client';
import { Bot, FileText, Store, Activity } from 'lucide-react';

interface Agent {
  _id: string;
  name: string;
  agentType?: string;
  isDraft: boolean;
  createdAt: string;
  ownerId?: string;
}

interface Execution {
  _id: string;
  agentDefinitionId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

type TabKind = 'agents' | 'drafts' | 'executions';

function AgentTable({ items, emptyMsg }: { items: Agent[]; emptyMsg: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map(a => (
            <tr key={a._id} className="hover:bg-accent/20 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{a.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className="text-xs capitalize bg-accent/60 px-2 py-1 rounded">{a.agentType ?? 'general'}</span>
              </td>
              <td className="py-3 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{emptyMsg}</p>}
    </div>
  );
}

function ExecutionTable({ items }: { items: Execution[] }) {
  const statusColor: Record<string, string> = {
    completed: 'text-emerald-400 bg-emerald-400/10',
    running: 'text-blue-400 bg-blue-400/10',
    failed: 'text-red-400 bg-red-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Run ID</th>
            <th className="pb-3 pr-4 font-medium">Agent</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map(e => (
            <tr key={e._id} className="hover:bg-accent/20 transition-colors">
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{e._id.slice(-8)}</td>
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{e.agentDefinitionId.slice(-8)}</td>
              <td className="py-3 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColor[e.status] ?? 'bg-accent/60'}`}>
                  {e.status}
                </span>
              </td>
              <td className="py-3 text-muted-foreground">{new Date(e.startedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No executions found.</p>}
    </div>
  );
}

export function AgentsTab({
  agents, drafts, executions, activeTab, setActiveTab,
}: {
  agents: Agent[];
  drafts: Agent[];
  executions: Execution[];
  activeTab: TabKind;
  setActiveTab: (t: TabKind) => void;
}) {
  const tabs: { id: TabKind; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'agents', label: 'Agents', icon: Bot, count: agents.length },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: drafts.length },
    { id: 'executions', label: 'Executions', icon: Activity, count: executions.length },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-border/60">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className="text-xs bg-accent/80 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>
      {activeTab === 'agents' && <AgentTable items={agents} emptyMsg="No agents found." />}
      {activeTab === 'drafts' && <AgentTable items={drafts} emptyMsg="No drafts found." />}
      {activeTab === 'executions' && <ExecutionTable items={executions} />}
    </div>
  );
}
