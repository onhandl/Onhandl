'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { Textarea } from '@/components/ui/forms/textarea';
import {
    Cpu as IconCpu,
    Wand2 as IconWand,
    ShieldCheck as IconShieldLock,
    Wallet as IconWallet,
    Rocket as IconRocket,
    Loader2 as IconLoader2,
    Check as IconCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { financialAgentApi, FinancialAgentPreset } from '@/api/financial.api';
import { useUXMode } from '@/contexts/UXModeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    initialPrompt?: string;
}

export default function CreateAgentModal({ isOpen, onClose, onComplete, initialPrompt = '' }: CreateAgentModalProps) {
    const router = useRouter();
    const { isLite } = useUXMode();
    const { activeWorkspace } = useWorkspace();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState(initialPrompt);
    const [draft, setDraft] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const reset = useCallback(() => {
        setStep(1);
        setName('');
        setDescription(initialPrompt);
        setDraft(null);
    }, [initialPrompt]);

    const handleCancel = useCallback(() => {
        setIsLoading(false);
        onClose();
        setTimeout(reset, 300);
    }, [onClose, reset]);

    useEffect(() => {
        if (isOpen) {
            setDescription(initialPrompt);
        }
    }, [initialPrompt, isOpen]);

    const handleDraft = async () => {
        if (!name.trim() || !description.trim()) {
            toast.error('Missing fields', {
                description: 'Provide both a name and a description.',
            });
            return;
        }
        if (!activeWorkspace) {
            toast.error('No workspace selected', {
                description: 'Create or select a workspace before creating an agent.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const preset: FinancialAgentPreset = isLite ? 'conservative_treasury' : 'balanced_allocator';
            const data = await financialAgentApi.draftFromPrompt(name, description, preset);
            setDraft(data);
            setStep(2);
        } catch (err: any) {
            toast.error('AI strategy failed', {
                description: err.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            await financialAgentApi.createFromStructured(draft);
            toast.success('Agent created', {
                description: `${name} is ready.`,
            });
            onComplete?.();
            onClose();
            setTimeout(reset, 300);
            router.push(isLite ? '/bot' : '/dashboard/assets');
        } catch (err: any) {
            toast.error('Initialization failed', {
                description: err.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="sm:max-w-[600px] overflow-hidden gap-0 rounded-3xl border border-border/50 bg-background p-0 shadow-2xl backdrop-blur-2xl">
                <div className="px-8 pt-8 pb-6 border-b border-border/50 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <IconCpu className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">
                                        {step === 1 ? (isLite ? 'Quick Draft' : 'Create Agent') : (isLite ? 'Ready to Create' : 'Review Agent')}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs font-medium text-muted-foreground tracking-widest mt-0.5">
                                        {step === 1 ? 'Name it and describe what it should do' : 'Confirm the generated draft'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2].map((s) => (
                                    <div key={s} className={cn(
                                        'h-1.5 rounded-full transition-all duration-500',
                                        s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-border'
                                    )} />
                                ))}
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-8 min-h-[360px] bg-background/60 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Agent Name</Label>
                                    <Input
                                        placeholder="e.g. Treasury Sentinel"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 rounded-2xl bg-card/80 border-border/50 focus:ring-primary/20 font-bold backdrop-blur-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Description</Label>
                                    <Textarea
                                        placeholder="Describe what this agent should do, the limits it should respect, and when it should act."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="min-h-[170px] rounded-2xl bg-card/80 border-border/50 focus:ring-primary/20 p-4 leading-relaxed font-medium backdrop-blur-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground/70 px-1 font-medium">
                                        Onhandl will turn this description into a managed agent policy.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                        {isLite ? 'Lite defaults' : 'Pro defaults'}
                                    </p>
                                    <p className="text-sm font-bold text-foreground">
                                        {isLite ? 'Conservative safety settings will be applied automatically.' : 'Advanced policy details will be generated automatically.'}
                                    </p>
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
                                <div className="p-6 rounded-3xl bg-card/80 border border-border/50 relative overflow-hidden group backdrop-blur-sm">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <IconWand size={48} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Generated Summary</p>
                                        <p className="text-sm font-bold leading-relaxed text-foreground/80 italic">"{draft?.agent?.description}"</p>
                                    </div>
                                </div>

                                {!isLite && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Generated Policies</p>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                                                <IconShieldLock size={12} /> Secured
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {draft?.agent?.networkConfigs?.[0]?.assetLimits?.map((limit: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-card/70 border border-border/50 shadow-sm backdrop-blur-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-background/70 flex items-center justify-center text-primary border border-border/50">
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
                                )}

                                <div className="rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Next Page</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {isLite ? 'After creation, you will continue in Assistant.' : 'After creation, you will continue in Assets & Treasury.'}
                                    </p>
                                </div>

                                <div className="p-4 border-t border-border/40 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <IconRocket size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Account Provisioning</p>
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mt-0.5">
                                            Finalizing will provision a managed CKB wallet controlled by this agent.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-8 py-6 border-t border-border/50 bg-card/70 backdrop-blur-xl flex items-center justify-between">
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
                                <>Preview Draft <IconWand size={18} className="group-hover:rotate-12 transition-transform" /></>
                            ) : (
                                <>Create Agent <IconCheck size={18} /></>
                            )}
                        </span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
