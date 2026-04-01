'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Coins, Zap, Crown, TrendingUp } from 'lucide-react';

const PLAN_LABELS: Record<string, { label: string; color: string; tokenLimit: number }> = {
  free:      { label: 'Free',      color: 'text-muted-foreground', tokenLimit: 500    },
  starter:   { label: 'Starter',   color: 'text-blue-500',         tokenLimit: 5000   },
  pro:       { label: 'Pro',       color: 'text-violet-500',       tokenLimit: 25000  },
  unlimited: { label: 'Unlimited', color: 'text-amber-500',        tokenLimit: 100000 },
};

const TOKEN_COSTS = [
  { action: 'Create an agent',              cost: 300 },
  { action: 'Agent query (chat)',            cost: 5   },
  { action: 'Publish agent to marketplace', cost: 10  },
  { action: 'Embed / PWA chat message',     cost: 3   },
  { action: 'Export as PWA',                cost: 5   },
];

interface Props {
  tokenInfo: { tokens: number; plan: string } | null;
  onUpgrade: () => void;
}

export function BillingSection({ tokenInfo, onUpgrade }: Props) {
  if (!tokenInfo) return null;

  const planMeta = PLAN_LABELS[tokenInfo.plan] ?? PLAN_LABELS.free;
  const usedPct  = Math.min(100, Math.max(0, ((planMeta.tokenLimit - tokenInfo.tokens) / planMeta.tokenLimit) * 100));

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/5">
          <CardTitle className="flex items-center gap-2 text-base"><Coins className="h-4 w-4 text-primary" /> Token Balance</CardTitle>
          <CardDescription>Your remaining tokens and current plan.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{Math.max(0, tokenInfo.tokens).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">tokens remaining</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-wider ${planMeta.color}`}>{planMeta.label} Plan</span>
              <p className="text-xs text-muted-foreground mt-0.5">{planMeta.tokenLimit.toLocaleString()} / month</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used this month</span><span>{Math.round(usedPct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${usedPct}%` }} />
            </div>
          </div>

          {tokenInfo.plan === 'free' && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Upgrade for more tokens and higher limits.</p>
              </div>
              <button onClick={onUpgrade}
                className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap">
                Upgrade
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/5">
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" /> Token Cost Reference</CardTitle>
          <CardDescription>How many tokens each action consumes.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {TOKEN_COSTS.map(({ action, cost }) => (
              <div key={action} className="flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors">
                <span className="text-sm text-muted-foreground">{action}</span>
                <span className="text-sm font-bold text-primary">{cost} tokens</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
