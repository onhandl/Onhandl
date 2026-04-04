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
    IconCircleCheck, IconNetwork,
} from '@tabler/icons-react';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (agent: any) => void;
}

const PROVIDERS = [
    { value: 'ollama',  label: 'Ollama (Local)',          defaultModel: 'qwen2.5:3b',       needsKey: false },
    { value: 'gemini',  label: 'Google Gemini',           defaultModel: 'gemini-1.5-flash',  needsKey: true  },
    { value: 'openai',  label: 'OpenAI',                  defaultModel: 'gpt-4o-mini',       needsKey: true  },
];

const TEMPLATE_META: Record<string, {
    icon: React.ReactNode;
    color: string;
    badge: string;
}> = {
    'blockchain-multi-step': {
        icon: <IconShield className="h-5 w-5 text-blue-500" />,
        color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10',
        badge: 'Financial',
    },
    'ai-advisor': {
        icon: <IconBox className="h-5 w-5 text-purple-500" />,
        color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10',
        badge: 'Operational',
    },
    'telegram-bot': {
        icon: <IconBolt className="h-5 w-5 text-yellow-500" />,
        color: 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 hover:bg-yellow-500/10',
        badge: 'Social',
    },
    'ckb-template': {
        icon: <IconRobot className="h-5 w-5 text-emerald-500" />,
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10',
        badge: 'Financial',
    },
};

/** Extract network/asset tags from template character data */
function extractNetworks(template: any): string[] {
    const fp = template?.character?.financial_profile
        || template?.character?.social_profile
        || template?.character?.operational_profile
        || {};
    return fp.supported_assets || fp.supported_platforms || [];
}

export default function TemplateModal({ isOpen, onClose, onSelect }: TemplateModalProps) {
    const { getTemplates, createAgentFromTemplate } = useAgentManager();
    const [templates, setTemplates]       = useState<any[]>([]);
    const [isLoading, setIsLoading]       = useState(false);
    const [selectedTemplate, setSelected] = useState<any | null>(null);
    const [agentName, setAgentName]       = useState('');
    const [modelProvider, setProvider]    = useState('ollama');
    const [apiKey, setApiKey]             = useState('');
    const [isCreating, setIsCreating]     = useState(false);

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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[680px] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
                            <IconSparkles className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            {selectedTemplate ? `Configure "${selectedTemplate.name}"` : 'Choose a Template'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {selectedTemplate
                            ? 'Name your agent and provide an API key. The character and workflow are ready to go.'
                            : 'Each template ships with a pre-built character and a fully connected workflow.'}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Template grid ── */}
                {!selectedTemplate ? (
                    isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Loading templates…</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 max-h-[460px] overflow-y-auto pr-1">
                            {templates.map((t) => {
                                const meta = TEMPLATE_META[t.id] || {
                                    icon: <IconSparkles className="h-5 w-5 text-primary" />,
                                    color: 'border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30',
                                    badge: 'Custom',
                                };
                                const networks = extractNetworks(t);
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelected(t)}
                                        className={`group text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${meta.color}`}
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="bg-card/80 p-2 rounded-lg border border-border/50 shadow-sm">
                                                    {meta.icon}
                                                </div>
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">
                                                    {meta.badge}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{t.name}</h4>
                                                <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2 text-muted-foreground">
                                                    {t.description}
                                                </p>
                                            </div>
                                            {/* Preferred networks */}
                                            {networks.length > 0 && (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <IconNetwork className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    {networks.map((n: string) => (
                                                        <span key={n} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                            {n}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                                                <span>{t.nodes?.length ?? 0} nodes</span>
                                                <span>{t.edges?.length ?? 0} connections</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                                <IconCircleCheck className="h-3 w-3" />
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
                    <div className="space-y-4 py-3">
                        {/* Agent name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="agent-name" className="text-sm font-medium">Agent Name</Label>
                            <Input
                                id="agent-name"
                                placeholder="e.g. My CKB Assistant"
                                value={agentName}
                                onChange={e => setAgentName(e.target.value)}
                                autoFocus
                                className="bg-muted/30 border-border focus-visible:ring-primary/40"
                            />
                        </div>

                        {/* Model provider */}
                        <div className="space-y-1.5">
                            <Label htmlFor="provider-select" className="text-sm font-medium">AI Model Provider</Label>
                            <select
                                id="provider-select"
                                value={modelProvider}
                                onChange={e => { setProvider(e.target.value); setApiKey(''); }}
                                className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>

                        {/* API key — only when needed */}
                        {providerConfig.needsKey && (
                            <div className="space-y-1.5">
                                <Label htmlFor="api-key" className="text-sm font-medium flex items-center gap-1.5">
                                    <IconKey className="h-3.5 w-3.5" />
                                    {providerConfig.label} API Key
                                </Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder={`Your ${providerConfig.label} API Key`}
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    className="bg-muted/30 border-border focus-visible:ring-primary/40"
                                />
                                <p className="text-[10px] text-muted-foreground ml-0.5">
                                    Leave empty to use the system default key
                                </p>
                            </div>
                        )}

                        {/* Networks preview */}
                        {extractNetworks(selectedTemplate).length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Networks:</span>
                                {extractNetworks(selectedTemplate).map((n: string) => (
                                    <span key={n} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        {n}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* What's included */}
                        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <IconCircleCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <p className="text-[11px] font-semibold text-foreground">Pre-built character &amp; fully wired workflow included</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {selectedTemplate.nodes?.map((n: any) => (
                                    <span key={n.id} className="px-2 py-0.5 bg-muted text-muted-foreground text-[9px] rounded-full border border-border">
                                        {n.data?.name || n.type}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2 rounded-xl" disabled={isCreating}>
                                <IconChevronLeft className="h-4 w-4" /> Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={!agentName.trim() || isCreating}
                                className="rounded-xl shadow-lg shadow-primary/20 px-8 flex-1 sm:flex-none gap-2"
                            >
                                {isCreating
                                    ? <IconLoader2 className="h-4 w-4 animate-spin" />
                                    : <IconArrowRight className="h-4 w-4" />}
                                {isCreating ? 'Creating…' : 'Use Template'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {!selectedTemplate && (
                    <p className="mt-3 pt-3 border-t border-border/50 text-[10px] text-center text-muted-foreground italic">
                        All templates include a pre-built character — no AI generation step required.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
