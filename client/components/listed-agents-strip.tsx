'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Bot, Star, ShoppingCart, ExternalLink } from 'lucide-react';
import { agentApi } from '@/api/agent-api';

export function ListedAgentsStrip() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentApi.getMarketplace({ limit: 5 })
      .then((d: any) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || agents.length === 0) return null;

  return (
    <div className="absolute top-14 left-0 right-0 z-20 px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-full">
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <Store className="w-3 h-3 text-[#9AB17A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marketplace</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
          {agents.map((agent) => {
            const mkt = agent.marketplace || {};
            const isFree = mkt.pricing?.type !== 'paid';
            return (
              <Link key={agent._id} href={`/marketplace/agent/${agent._id}`}>
                <div className="flex-shrink-0 w-44 rounded-xl border border-zinc-700/60 bg-zinc-900/90 backdrop-blur-sm hover:border-[#9AB17A]/50 hover:bg-zinc-900 transition-all duration-150 p-3 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#9AB17A]/15 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-[#9AB17A]" />
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isFree ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#9AB17A]/15 text-[#9AB17A]'}`}>
                      {isFree ? 'Free' : `${mkt.pricing?.currency} ${mkt.pricing?.price}`}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-100 line-clamp-1 group-hover:text-[#C3CC9B] transition-colors">{agent.name}</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{agent.description || 'No description.'}</p>
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-zinc-600">
                    <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{(mkt.stats?.rating || 0).toFixed(1)}</span>
                    <span className="flex items-center gap-0.5"><ShoppingCart className="w-2.5 h-2.5" />{mkt.stats?.purchases || 0}</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
