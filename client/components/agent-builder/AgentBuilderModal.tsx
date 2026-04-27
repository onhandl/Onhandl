'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ArrowRight, ArrowLeft, Cpu, Sparkles, Loader2, UserPlus, LogIn,
    Check, Wand2, Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api';
import { financialAgentApi } from '@/api/financial.api';
import { cn } from '@/lib/utils';

const DRAFT_KEY = 'onhandl_agent_draft';

type Step = 'name' | 'description' | 'auth' | 'creating';
type AuthMode = 'signup' | 'signin';

interface Draft { name: string; description: string; }

function saveDraft(draft: Draft) {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { }
}
function loadDraft(): Draft | null {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function clearDraft() {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { }
}

interface AgentBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const steps: Step[] = ['name', 'description', 'auth', 'creating'];
const stepLabels = ['Name', 'Describe', 'Sign Up', 'Launch'];

export function AgentBuilderModal({ isOpen, onClose }: AgentBuilderModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>('name');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [authMode, setAuthMode] = useState<AuthMode>('signup');
    const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check auth on open
    useEffect(() => {
        if (!isOpen) return;
        const restored = loadDraft();
        if (restored) {
            setName(restored.name || '');
            setDescription(restored.description || '');
        }
        authApi.getMe().then(() => setIsAuthenticated(true)).catch(() => setIsAuthenticated(false));
    }, [isOpen]);

    const handleClose = useCallback(() => {
        clearDraft();
        setStep('name');
        setName('');
        setDescription('');
        setAuthForm({ username: '', email: '', password: '' });
        setIsLoading(false);
        onClose();
    }, [onClose]);

    const handleNameNext = () => {
        if (!name.trim()) { toast.error('Please give your agent a name.'); return; }
        setStep('description');
    };

    const handleDescriptionNext = () => {
        if (!description.trim()) { toast.error('Please describe what your agent should do.'); return; }
        const draft: Draft = { name, description };
        saveDraft(draft);
        if (isAuthenticated) {
            createAgent(draft);
        } else {
            setStep('auth');
        }
    };

    const createAgent = async (draft: Draft) => {
        setStep('creating');
        setIsLoading(true);
        try {
            await financialAgentApi.draftFromPrompt(draft.name, draft.description, 'balanced_allocator')
                .then((data: any) => financialAgentApi.createFromStructured(data));
            clearDraft();
            toast.success(`${draft.name} is ready!`, { description: 'Your agent has been deployed.' });
            onClose();
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Agent creation failed', { description: err.message });
            setStep('description');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authApi.register({ username: authForm.username, email: authForm.email, password: authForm.password });
            toast.success('Account created!', { description: 'Please verify your email to continue.' });
            // Save draft and redirect to verify-email, then dashboard will resume
            router.push(`/verify-email?email=${encodeURIComponent(authForm.email)}&resume=agent`);
            onClose();
        } catch (err: any) {
            toast.error('Sign up failed', { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authApi.login({ email: authForm.email, password: authForm.password });
            setIsAuthenticated(true);
            toast.success('Signed in!');
            const draft: Draft = { name, description };
            createAgent(draft);
        } catch (err: any) {
            toast.error('Sign in failed', { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const currentStepIndex = steps.indexOf(step);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ duration: 0.45, ease }}
                        className="relative w-full max-w-lg rounded-3xl border border-border/50 bg-background shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 border-b border-border/40">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black tracking-tight">
                                            {step === 'name' && 'Name Your Agent'}
                                            {step === 'description' && 'Describe Its Mission'}
                                            {step === 'auth' && 'Sign Up to Continue'}
                                            {step === 'creating' && 'Launching Agent…'}
                                        </h2>
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                                            {step === 'creating' ? 'Deploying to Financial Studio' : 'Agent Builder'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Progress */}
                            {step !== 'creating' && (
                                <div className="flex items-center gap-2">
                                    {stepLabels.slice(0, isAuthenticated ? 3 : 4).map((label, i) => {
                                        const effectiveIndex = isAuthenticated && i >= 2 ? i + 1 : i;
                                        const isDone = effectiveIndex < currentStepIndex;
                                        const isActive = effectiveIndex === currentStepIndex;
                                        return (
                                            <div key={label} className="flex items-center gap-2">
                                                <div className={cn(
                                                    'flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                                                    isActive ? 'text-primary' : isDone ? 'text-emerald-500' : 'text-muted-foreground/40'
                                                )}>
                                                    <div className={cn(
                                                        'w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-black transition-all',
                                                        isActive ? 'border-primary bg-primary/10 text-primary' :
                                                            isDone ? 'border-emerald-500 bg-emerald-500 text-white' :
                                                                'border-border text-muted-foreground/40'
                                                    )}>
                                                        {isDone ? <Check size={10} /> : i + 1}
                                                    </div>
                                                    {label}
                                                </div>
                                                {i < (isAuthenticated ? 2 : 3) && (
                                                    <div className={cn('h-px w-6 rounded', isDone ? 'bg-emerald-500' : 'bg-border/60')} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-8 py-8 min-h-[260px] bg-background/60">
                            <AnimatePresence mode="wait">

                                {/* STEP 1: NAME */}
                                {step === 'name' && (
                                    <motion.div key="name" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, ease }} className="space-y-6">
                                        <p className="text-sm text-muted-foreground font-medium">
                                            Give your agent an identity — a name it will be recognized by inside your studio.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Agent Name</label>
                                            <input
                                                autoFocus
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                                                placeholder="e.g. Treasury Sentinel"
                                                className="w-full h-12 px-4 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm font-bold transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleNameNext}
                                            className="w-full h-12 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                                        >
                                            Next <ArrowRight size={16} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 2: DESCRIPTION */}
                                {step === 'description' && (
                                    <motion.div key="desc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, ease }} className="space-y-6">
                                        <p className="text-sm text-muted-foreground font-medium">
                                            Describe what <span className="font-bold text-foreground">{name}</span> should do — in plain language. Onhandl will convert it into a policy.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mission Description</label>
                                            <textarea
                                                autoFocus
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="e.g. Save 30% of all incoming CKB and send the rest to my main wallet…"
                                                className="w-full min-h-[130px] p-4 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm font-medium resize-none transition-all leading-relaxed"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setStep('name')} className="h-12 px-5 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center gap-2">
                                                <ArrowLeft size={16} /> Back
                                            </button>
                                            <button
                                                onClick={handleDescriptionNext}
                                                className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                                            >
                                                {isAuthenticated ? <><Wand2 size={16} /> Create Agent</> : <> Continue <ArrowRight size={16} /></>}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: AUTH */}
                                {step === 'auth' && (
                                    <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, ease }} className="space-y-5">
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                                <Sparkles size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest">Draft Saved</p>
                                                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                                                    Your agent <span className="font-bold text-primary">"{name}"</span> will be created immediately after you sign in or sign up.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Auth mode toggle */}
                                        <div className="flex items-center gap-1 p-1 rounded-xl border border-border/60 bg-muted/20">
                                            {(['signup', 'signin'] as AuthMode[]).map(mode => (
                                                <button key={mode} onClick={() => setAuthMode(mode)}
                                                    className={cn('flex-1 h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                                                        authMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                                    )}>
                                                    {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                                                </button>
                                            ))}
                                        </div>

                                        <form onSubmit={authMode === 'signup' ? handleSignup : handleSignin} className="space-y-3">
                                            {authMode === 'signup' && (
                                                <input
                                                    required
                                                    placeholder="Username"
                                                    value={authForm.username}
                                                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                                                    className="w-full h-11 px-4 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                                                />
                                            )}
                                            <input
                                                required
                                                type="email"
                                                placeholder="Email address"
                                                value={authForm.email}
                                                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                                                className="w-full h-11 px-4 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                                            />
                                            <input
                                                required
                                                type="password"
                                                placeholder="Password"
                                                value={authForm.password}
                                                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                                                className="w-full h-11 px-4 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                                            />
                                            <div className="flex gap-3 pt-1">
                                                <button type="button" onClick={() => setStep('description')} className="h-11 px-5 rounded-2xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all flex items-center gap-2">
                                                    <ArrowLeft size={16} /> Back
                                                </button>
                                                <button type="submit" disabled={isLoading}
                                                    className="flex-1 h-11 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                                                >
                                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> :
                                                        authMode === 'signup' ? <><UserPlus size={16} /> Sign Up & Create</> : <><LogIn size={16} /> Sign In & Create</>}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}

                                {/* STEP: CREATING */}
                                {step === 'creating' && (
                                    <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 gap-5">
                                        <div className="relative w-16 h-16">
                                            <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
                                            <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Cpu size={24} className="text-primary" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-base uppercase tracking-widest text-foreground">Building {name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Generating policies and deploying…</p>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
