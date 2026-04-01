'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, KeyRound, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  // kept for backward-compat with flow-builder, but no longer used
  onSave?: (provider: string, apiKey: string) => void;
}

interface KeyStatus {
  hasGemini: boolean;
  hasOpenai: boolean;
  hasOllama: boolean;
  openaiBaseUrl?: string;
  openaiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Used for persona enhancement and agent AI calls.',
    statusKey: 'hasGemini' as keyof KeyStatus,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'Compatible with any OpenAI-format provider or proxy.',
    statusKey: 'hasOpenai' as keyof KeyStatus,
    extraFields: [
      { key: 'openaiBaseUrl' as keyof KeyStatus, label: 'Base URL' },
      { key: 'openaiModel'   as keyof KeyStatus, label: 'Model'    },
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    description: 'Local LLM server — no API key required.',
    statusKey: 'hasOllama' as keyof KeyStatus,
    extraFields: [
      { key: 'ollamaBaseUrl' as keyof KeyStatus, label: 'Base URL' },
      { key: 'ollamaModel'   as keyof KeyStatus, label: 'Model'    },
    ],
  },
];

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    apiFetch('/auth/api-keys')
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const goToSettings = () => {
    onClose();
    router.push('/settings');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">AI Provider Keys</h3>
                  <p className="text-xs text-muted-foreground">Managed in your profile settings</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading key status…</span>
                </div>
              ) : !status ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Could not load key status. Go to Settings to configure.
                </p>
              ) : (
                PROVIDERS.map((p) => {
                  const saved = !!status[p.statusKey];
                  return (
                    <div key={p.id} className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{p.label}</span>
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          saved
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-muted/60 text-muted-foreground'
                        }`}>
                          {saved
                            ? <><CheckCircle2 className="w-3 h-3" /> Configured</>
                            : <><AlertCircle  className="w-3 h-3" /> Not set</>}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>

                      {/* Non-secret config values */}
                      {p.extraFields?.map(({ key, label }) => {
                        const val = status[key] as string | undefined;
                        return val ? (
                          <div key={String(key)} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-16 shrink-0">{label}:</span>
                            <span className="font-mono text-foreground/80 truncate">{val}</span>
                          </div>
                        ) : null;
                      })}

                      {/* Secret key placeholder */}
                      {saved && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16 shrink-0">API Key:</span>
                          <span className="font-mono text-foreground/50 tracking-widest">••••••••••••</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={goToSettings}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                <ExternalLink className="w-4 h-4" />
                Edit Keys in Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
