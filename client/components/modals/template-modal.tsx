'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { useAgentManager } from '@/hooks';
import {
    IconSparkles, IconBolt, IconShield, IconBox, IconRobot,
    IconArrowRight, IconLoader2, IconChevronLeft, IconKey,
    IconCircleCheck, IconNetwork, IconTemplate,
} from '@tabler/icons-react';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (agent: any) => void;
}

const PROVIDERS = [
    { value: 'ollama', label: 'Ollama (Local)', defaultModel: 'qwen2.5:3b', needsKey: false },
    { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-1.5-flash', needsKey: true },
    { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', needsKey: true },
];

const TEMPLATE_META: Record<string, {
    icon: React.ReactNode;
    badge: string;
}> = {
    'blockchain-multi-step': {
        icon: <IconShield className="h-4 w-4 text-primary" />,
        badge: 'Financial',
    },
    'ai-advisor': {
        icon: <IconBox className="h-4 w-4 text-primary" />,
        badge: 'Operational',
    },
    'telegram-bot': {
        icon: <IconBolt className="h-4 w-4 text-primary" />,
        badge: 'Social',
    },
    'ckb-template': {
        icon: <IconRobot className="h-4 w-4 text-primary" />,
        badge: 'Financial',
    },
};

function extractNetworks(template: any): string[] {
    const fp = template?.character?.financial_profile
        || template?.character?.social_profile
        || template?.character?.operational_profile
        || {};
    return fp.supported_assets || fp.supported_platforms || [];
}

export default function TemplateModal({ isOpen, onClose, onSelect }: TemplateModalProps) {
    const { getTemplates, createAgentFromTemplate } = useAgentManager();
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelected] = useState<any | null>(null);
    const [agentName, setAgentName] = useState('');
    const [modelProvider, setProvider] = useState('ollama');
    const [apiKey, setApiKey] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const providerConfig = PROVIDERS.find(p => p.value === modelProvider)!;

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getTemplates().then(data => {
                setTemplates(data || []);
                setIsLoading(false);
            });
        }
    }, [isOpen, getTemplates]);

    const handleConfirm = async () => {
        if (!agentName.trim()) return;
        setIsCreating(true);
        try {
            const agent = await createAgentFromTemplate(
                selectedTemplate.id, agentName,
                modelProvider, providerConfig.defaultModel,
                apiKey || undefined,
            );
            onSelect(agent);
            handleClose();
        } catch { /* toast shown by hook */ } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        onClose();
        setSelected(null);
        setAgentName('');
        setApiKey('');
        setProvider('ollama');
    };

    const step = selectedTemplate ? 2 : 1;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col bg-card border-border/60 shadow-xl p-0 overflow-hidden gap-0">
                {/* Top accent line */}
                <div className="h-px w-full bg-gradient-to-r from-primary/70 to-primary/10" />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                                <IconTemplate className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base font-bold leading-snug">
                                    {selectedTemplate ? `Configure "${selectedTemplate.name}"` : 'Choose a Template'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-snug mt-0">
                                    {selectedTemplate
                                        ? 'Name your agent and provide an API key. The character and workflow are ready to go.'
                                        : 'Each template ships with a pre-built character and a fully connected workflow.'}
                                </DialogDescription>
                            </div>
                            {/* Step indicators */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {[1, 2].map((s) => (
                                    <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-6 bg-primary' : s < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'}`} />
                                ))}
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* ── Template grid ── */}
                    {!selectedTemplate ? (
                        isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading templates…</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {templates.map((t) => {
                                    const meta = TEMPLATE_META[t.id] || {
                                        icon: <IconSparkles className="h-4 w-4 text-primary" />,
                                        badge: 'Custom',
                                    };
                                    const networks = extractNetworks(t);
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelected(t)}
                                            className="group flex flex-col justify-between text-left p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                                                        {meta.icon}
                                                    </div>
                                                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">
                                                        {meta.badge}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{t.name}</h4>
                                                    <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2 text-muted-foreground">
                                                        {t.description}
                                                    </p>
                                                </div>
                                                {networks.length > 0 && (
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <IconNetwork className="h-3 w-3 text-primary shrink-0" />
                                                        {networks.map((n: string) => (
                                                            <span key={n} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/15">
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex gap-3 text-[11px] text-muted-foreground">
                                                    <span>{t.nodes?.length ?? 0} nodes</span>
                                                    <span>{t.edges?.length ?? 0} connections</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
                                                    <IconCircleCheck className="h-3.5 w-3.5" />
                                                    Pre-built
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* ── Configuration step ── */
                        <div className="space-y-5">
                            {/* Agent name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="agent-name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agent Name</Label>
                                <Input
                                    id="agent-name"
                                    placeholder="e.g. My CKB Assistant"
                                    value={agentName}
                                    onChange={e => setAgentName(e.target.value)}
                                    autoFocus
                                    className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                                />
                            </div>

                            {/* Model provider */}
                            <div className="space-y-1.5">
                                <Label htmlFor="provider-select" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Model Provider</Label>
                                <select
                                    id="provider-select"
                                    value={modelProvider}
                                    onChange={e => { setProvider(e.target.value); setApiKey(''); }}
                                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>

                            {/* API key */}
                            {providerConfig.needsKey && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="api-key" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <IconKey className="h-3.5 w-3.5" />
                                        {providerConfig.label} API Key
                                    </Label>
                                    <Input
                                        id="api-key"
                                        type="password"
                                        placeholder={`Your ${providerConfig.label} API Key`}
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-0.5">
                                        Leave empty to use the system default key
                                    </p>
                                </div>
                            )}

                            {/* Networks preview */}
                            {extractNetworks(selectedTemplate).length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Networks</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {extractNetworks(selectedTemplate).map((n: string) => (
                                            <span key={n} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/15">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* What's included */}
                            <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <IconCircleCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <p className="text-[11px] font-semibold text-foreground">Pre-built character &amp; fully wired workflow included</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedTemplate.nodes?.map((n: any) => (
                                        <span key={n.id} className="px-2 py-0.5 bg-muted text-muted-foreground text-[9px] rounded-md border border-border/40">
                                            {n.data?.name || n.type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 flex items-center justify-end gap-2">
                    {!selectedTemplate ? (
                        <Button variant="ghost" onClick={handleClose} className="h-9 px-4 rounded-xl text-sm">
                            Cancel
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setSelected(null)}
                                disabled={isCreating}
                                className="h-9 px-4 rounded-xl text-sm gap-1.5"
                            >
                                <IconChevronLeft className="h-3.5 w-3.5" /> Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={!agentName.trim() || isCreating}
                                className="h-9 px-5 rounded-xl text-sm bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 gap-1.5"
                            >
                                {isCreating
                                    ? <><IconLoader2 className="h-3.5 w-3.5 animate-spin" />Creating…</>
                                    : <><IconArrowRight className="h-3.5 w-3.5" />Use Template</>}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}