'use client';
import { useState } from 'react';
import { adminApi } from '@/api';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';

interface Ticket {
  _id: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  open: 'text-yellow-400 bg-yellow-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  resolved: 'text-emerald-400 bg-emerald-400/10',
  closed: 'text-muted-foreground bg-accent/60',
};

export function SupportTab({ tickets: initial }: { tickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initial);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateTicket = async (id: string, status: string, adminNotes: string) => {
    setSaving(true);
    const data = await adminApi.updateSupportTicket(id, { status, adminNotes });
    setTickets(t => t.map(x => x._id === id ? data : x));
    setSelected(data);
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Ticket list */}
      <div className="space-y-2">
        {tickets.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No support tickets yet.</p>
        )}
        {tickets.map(t => (
          <button
            key={t._id}
            onClick={() => { setSelected(t); setNotes(t.adminNotes ?? ''); }}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?._id === t._id
                ? 'border-primary bg-primary/5'
                : 'border-border/60 hover:border-border hover:bg-accent/20'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.userName} · {t.userEmail}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded shrink-0 font-medium capitalize ${statusColors[t.status]}`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.message}</p>
          </button>
        ))}
      </div>

      {/* Ticket detail */}
      {selected ? (
        <div className="border border-border/60 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">{selected.subject}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{selected.userName} · {selected.userEmail}</p>
            <p className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</p>
          </div>
          <p className="text-sm text-foreground bg-accent/30 rounded p-3">{selected.message}</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
            <select
              defaultValue={selected.status}
              onChange={e => setSelected(s => s ? { ...s, status: e.target.value as any } : s)}
              className="w-full bg-background border border-border/60 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Admin Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes..."
              className="w-full bg-background border border-border/60 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => updateTicket(selected._id, selected.status, notes)}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      ) : (
        <div className="border border-border/60 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
          Select a ticket to view details
        </div>
      )}
    </div>
  );
}
