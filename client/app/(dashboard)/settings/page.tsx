'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Loader2, User, KeyRound, CreditCard, Bell, Coins, ChevronRight, MessageCircle } from 'lucide-react';
import { ProfileSection } from './components/profile-section';
import { ApiKeysCard } from './components/api-keys-card';
import { TelegramSection } from './components/telegram-section';
import { toast } from 'sonner';

type Section = 'profile' | 'api-keys' | 'integrations';

const NAV: { key: Section; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'profile', label: 'Profile', icon: User, description: 'Your account info' },
  { key: 'api-keys', label: 'AI Provider Keys', icon: KeyRound, description: 'Gemini, OpenAI, Ollama' },
  { key: 'integrations', label: 'Integrations', icon: MessageCircle, description: 'Telegram, WhatsApp, etc.' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Section>('profile');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ tokens: number; plan: string } | null>(null);
  const [user, setUser] = useState({ username: '', email: '', whatsapp: '', telegramUsername: '', avatarUrl: '' });


  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as Section | null;

  useEffect(() => {
    if (sectionParam && NAV.some(n => n.key === sectionParam)) {
      setActive(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    apiFetch('/auth/me').then((data: any) => {
      setUser({ username: data.username || '', email: data.email || '', whatsapp: data.whatsapp || '', telegramUsername: data.telegramUsername || '', avatarUrl: data.avatarUrl || '' });
      setTokenInfo({ tokens: data.tokens ?? 0, plan: data.plan ?? 'free' });
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeNav = NAV.find((n) => n.key === active)!;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account, billing, integrations and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-5">

          {/* ── Sidebar nav (desktop) / horizontal scroll (mobile) ── */}
          <aside className="md:w-56 flex-shrink-0">
            {/* Mobile: horizontal pill row */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none">
              {NAV.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActive(key)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${active === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop: vertical nav card */}
            <nav className="hidden md:flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden">
              {NAV.map(({ key, label, icon: Icon, description }, idx) => (
                <button key={key} onClick={() => setActive(key)}
                  className={`group flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${idx !== NAV.length - 1 ? 'border-b border-border/40' : ''
                    } ${active === key
                      ? 'bg-primary/8 text-foreground'
                      : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active === key ? 'bg-primary/15' : 'bg-muted/40 group-hover:bg-muted/60'
                    }`}>
                    <Icon className={`w-4 h-4 ${active === key ? 'text-primary' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${active === key ? 'text-foreground' : ''}`}>{label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{description}</p>
                  </div>
                  {active === key && <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content panel ── */}
          <div className="flex-1 min-w-0">
            {/* Section heading */}
            <div className="mb-4 hidden md:block">
              <div className="flex items-center gap-2">
                <activeNav.icon className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-bold">{activeNav.label}</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{activeNav.description}</p>
            </div>

            {active === 'profile' && (
              <ProfileSection user={user} setUser={setUser} />
            )}
            {active === 'api-keys' && (
              <ApiKeysCard />
            )}
            {active === 'integrations' && (
              <TelegramSection />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}