'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Label } from '@/components/ui/forms/label';
import {
    IconCpu, IconWand, IconLoader2, IconCheck, IconChevronRight,
    IconShieldLock, IconWallet, IconRocket, IconNetwork
} from '@tabler/icons-react';
import { financialAgentApi } from '@/api/financial-agent-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

const NETWORKS = [
    { id: 'CKB', label: 'Nervos CKB', sub: 'Managed Wallet' },
];

const PRESETS = [
    { id: 'conservative', label: 'Conservative', description: 'Low spending limits, strict allowlists.' },
    { id: 'aggressive', label: 'Aggressive', description: 'Higher limits, faster rotations.' },
    { id: 'custom', label: 'Custom', description: 'AI tailored to your specific prompt.' },
];

export default function CreateAgentModal({ isOpen, onClose, onComplete }: CreateAgentModalProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [preset, setPreset] = useState('custom');
    const [network, setNetwork] = useState('CKB');
    const [draft, setDraft] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter(); const reset = () => {
        setStep(1); setName(''); setPrompt('');
        setPreset('custom'); setNetwork('CKB');
        setDraft(null);
    };

    const handleCancel = useCallback(() => {
        setIsLoading(false);
        onClose();
        setTimeout(reset, 300);
    }, [onClose]);

    const handleDraft = async () => {
        if (!name.trim() || !prompt.trim()) {
            alert('Missing fields: Provide both a name and a prompt.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await financialAgentApi.draftFromPrompt(name, prompt, preset);
            setDraft(data);
            setStep(2);
        } catch (err: any) {
            alert('AI Strategy Failed: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const agent = await financialAgentApi.createFromStructured(draft);
            alert(`Agent Initialized: ${name} is now monitoring the ${network} network.`);
            if (onComplete) onComplete();
            onClose();
            setTimeout(reset, 300);
            router.push('/dashboard');
        } catch (err: any) {
            alert('Initialization failed: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl p-0 overflow-hidden gap-0 rounded-[2rem]">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-violet-500" />

                <div className="px-8 pt-8 pb-6 border-b border-border/40 bg-muted/20">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                                    <IconCpu className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">
                                        {step === 1 ? 'Initialize Strategy' : 'Strategy Review'}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {step === 1 ? 'Drafting the autonomous core' : 'Validating policy constraints'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2].map((s) => (
                                    <div key={s} className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-4 bg-border"
                                    )} />
                                ))}
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-8 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Agent Name</Label>
                                        <Input
                                            placeholder="e.g. Treasury Sentinel"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-12 rounded-2xl bg-muted/30 border-border/40 focus:ring-primary/20 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Network</Label>
                                        <Select value={network} onValueChange={setNetwork}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/40">
                                                <div className="flex items-center gap-2">
                                                    <IconNetwork size={16} className="text-primary" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border/40">
                                                {NETWORKS.map(n => (
                                                    <SelectItem key={n.id} value={n.id} className="rounded-xl">
                                                        <span className="font-bold">{n.label}</span>
                                                        <span className="ml-2 text-[10px] text-muted-foreground uppercase">{n.sub}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Autonomous Strategy</Label>
                                    <Textarea
                                        placeholder="Describe the financial logic... e.g. Automatically move funds to the cold wallet if the balance exceeds 5000 CKB, but only if the gas price is low."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="min-h-[140px] rounded-2xl bg-muted/30 border-border/40 focus:ring-primary/20 p-4 leading-relaxed font-medium"
                                    />
                                    <p className="text-[10px] text-muted-foreground/60 px-1 font-medium">
                                        Our AI will interpret this prompt and generate a formal policy set.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Risk Preset</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {PRESETS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setPreset(p.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl border text-left transition-all duration-300",
                                                    preset === p.id
                                                        ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 ring-1 ring-primary/20"
                                                        : "bg-muted/10 border-border/40 hover:border-primary/20 group"
                                                )}
                                            >
                                                <div className={cn("text-xs font-black uppercase tracking-wider mb-1 transition-colors", preset === p.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                                                    {p.label}
                                                </div>
                                                <div className="text-[9px] leading-tight text-muted-foreground/80 font-medium">
                                                    {p.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <IconWand size={48} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">AI PROPOSED BIO</p>
                                        <p className="text-sm font-bold leading-relaxed text-foreground/80 italic">"{draft?.description}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Generated Policies</p>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                                            <IconShieldLock size={12} /> SECURED
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {draft?.networkConfigs?.[0]?.assetLimits?.map((limit: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-primary border border-border/40">
                                                        <IconWallet size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{limit.asset}</p>
                                                        <p className="text-sm font-bold">Max Spend: {limit.maxSpendPerTx || 'Unrestricted'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 uppercase">
                                                        Limit Active
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-border/40 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <IconRocket size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Next Step: Account Provisioning</p>
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mt-0.5">
                                            Finalizing will provision a unique managed wallet on {network}. This account will be controlled by your strategy.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => step === 1 ? handleCancel() : setStep(1)}
                        className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted"
                    >
                        {step === 1 ? 'Discard' : 'Back'}
                    </Button>

                    <Button
                        onClick={step === 1 ? handleDraft : handleCreate}
                        disabled={isLoading}
                        className="h-12 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.1em] shadow-2xl shadow-primary/20 group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isLoading ? (
                                <IconLoader2 className="animate-spin" size={18} />
                            ) : step === 1 ? (
                                <>DRAFT STRATEGY <IconWand size={18} className="group-hover:rotate-12 transition-transform" /></>
                            ) : (
                                <>AUTHORIZE & CREATE <IconCheck size={18} /></>
                            )}
                        </span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
