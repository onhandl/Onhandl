'use client';
import { useState, useEffect } from 'react';
import { Headphones, Plus, X, Loader2, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/buttons/button';
import { apiFetch } from '@/lib/api-client';

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: 'Open',        color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10',    icon: MessageSquare },
  resolved:    { label: 'Resolved',    color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
  closed:      { label: 'Closed',      color: 'text-muted-foreground bg-accent/60', icon: X },
};

function NewTicketForm({ onCreated }: { onCreated: (t: Ticket) => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required.'); return; }
    setSaving(true); setError('');
    try {
      const data = await apiFetch('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, message }),
      });
      onCreated(data);
      setSubject(''); setMessage(''); setOpen(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit ticket');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        New Ticket
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Submit Support Ticket</h2>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Subject</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Brief description of your issue..."
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe your issue in detail..."
          rows={6}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving} size="sm">
          {saving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          Submit Ticket
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/support/tickets')
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (t: Ticket) => setTickets(prev => [t, ...prev]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Support</h1>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </div>
        </div>
        <NewTicketForm onCreated={handleCreated} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-xl">
          <Headphones className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No tickets yet. Submit one if you need help!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const cfg = statusConfig[ticket.status] ?? statusConfig.open;
            const StatusIcon = cfg.icon;
            return (
              <div key={ticket._id} className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ticket.message}</p>
                {ticket.adminNotes && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-medium text-primary mb-1">Admin Response</p>
                    <p className="text-sm text-foreground/90">{ticket.adminNotes}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
