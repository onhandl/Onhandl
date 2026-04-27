'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Cpu, Wand2, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api';
import { financialAgentApi } from '@/api/financial.api';
import { cn } from '@/lib/utils';
import SignUp from '@/app/(auth)/signup/page';
import SignIn from '@/app/(auth)/signin/page';

const DRAFT_KEY = 'onhandl_agent_draft';

type Step = 'name' | 'description' | 'auth' | 'creating';

interface Draft { name: string; description: string; }

function saveDraft(d: Draft) { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { } }
function loadDraft(): Draft | null { try { const r = sessionStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch { } }

interface AgentBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function AgentBuilderModal({ isOpen, onClose }: AgentBuilderModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>('name');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const restored = loadDraft();
        if (restored) { setName(restored.name || ''); setDescription(restored.description || ''); }
        authApi.getMe().then(() => setIsAuthenticated(true)).catch(() => setIsAuthenticated(false));
    }, [isOpen]);

    const handleClose = useCallback(() => {
        clearDraft();
        setStep('name');
        setName('');
        setDescription('');
        onClose();
    }, [onClose]);

    const handleNameNext = () => {
        if (!name.trim()) { toast.error('Please give your agent a name.'); return; }
        setStep('description');
    };

    const handleDescriptionNext = async () => {
        if (!description.trim()) { toast.error('Please describe what your agent should do.'); return; }
        saveDraft({ name, description });
        setIsCheckingAuth(true);
        try {
            await authApi.getMe();
            setIsAuthenticated(true);
            await createAgent({ name, description });
        } catch {
            setStep('auth');
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const createAgent = async (draft: Draft) => {
        setStep('creating');
        try {
            const data = await financialAgentApi.draftFromPrompt(draft.name, draft.description, 'balanced_allocator');
            await financialAgentApi.createFromStructured(data);
            clearDraft();
            toast.success(`${draft.name} is ready!`, { description: 'Your agent has been deployed.' });
            onClose();
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Agent creation failed', { description: err.message });
            setStep('description');
        }
    };

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
                    {/* Blurred backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Modal shell */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 28 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 28 }}
                        transition={{ duration: 0.45, ease }}
                        className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0f0f11] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden"
                    >
                        <AnimatePresence mode="wait">

                            {/* ═══════════════════ STEP: NAME ═══════════════════ */}
                            {step === 'name' && (
                                <motion.div key="name" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease }}>
                                    {/* Gradient top bar */}
                                    <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-rose-500" />

                                    <div className="p-8">
                                        {/* Close */}
                                        <button onClick={handleClose} className="absolute top-5 right-5 p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                            <X size={18} />
                                        </button>

                                        {/* Icon + Label */}
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/30">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Step 1 of 2</p>
                                                <h2 className="text-lg font-black tracking-tight text-white">Name Your Agent</h2>
                                            </div>
                                        </div>

                                        <p className="text-sm text-white/50 font-medium mb-6 leading-relaxed">
                                            Give your agent an identity — a name it will carry inside your Financial Studio.
                                        </p>

                                        <div className="space-y-2 mb-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Agent Name</label>
                                            <input
                                                autoFocus
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                                                placeholder="e.g. Treasury Sentinel"
                                                className="w-full h-13 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm font-bold transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={handleNameNext}
                                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/30"
                                        >
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: DESCRIPTION ═══════════════════ */}
                            {step === 'description' && (
                                <motion.div key="desc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease }}>
                                    <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-rose-500" />

                                    <div className="p-8">
                                        <button onClick={handleClose} className="absolute top-5 right-5 p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                            <X size={18} />
                                        </button>

                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                                <Wand2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400/70">Step 2 of 2</p>
                                                <h2 className="text-lg font-black tracking-tight text-white">Define the Mission</h2>
                                            </div>
                                        </div>

                                        {/* Draft preview chip */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[11px] font-black text-primary tracking-wider">{name}</span>
                                        </div>

                                        <p className="text-sm text-white/50 font-medium mb-6 leading-relaxed">
                                            Describe what <span className="font-bold text-white/80">{name}</span> should do in plain language. Onhandl converts it into a live financial policy.
                                        </p>

                                        <div className="space-y-2 mb-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Mission</label>
                                            <textarea
                                                autoFocus
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="e.g. Save 30% of incoming CKB and forward the rest to my cold wallet…"
                                                className="w-full min-h-[120px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 text-sm font-medium resize-none transition-all leading-relaxed"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => setStep('name')} className="h-12 px-5 rounded-2xl border border-white/10 text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                                                <ArrowLeft size={16} />
                                            </button>
                                            <button
                                                onClick={handleDescriptionNext}
                                                disabled={isCheckingAuth}
                                                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-violet-500/20"
                                            >
                                                {isCheckingAuth
                                                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Checking…</>
                                                    : <><Wand2 size={15} /> Create Agent</>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: AUTH ═══════════════════ */}
                            {step === 'auth' && (
                                <motion.div key="auth" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease }}>
                                    <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-primary to-violet-500" />

                                    {/* Close */}
                                    <button onClick={handleClose} className="absolute top-5 right-5 z-10 p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                        <X size={18} />
                                    </button>

                                    {/* Draft context banner */}
                                    <div className="px-6 pt-6 pb-4">
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20">
                                            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                                <Sparkles size={16} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Draft Ready</p>
                                                <p className="text-xs font-semibold text-white/60 truncate">
                                                    <span className="font-black text-white">{name}</span> will be created right after you sign in.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sign Up / Sign In pill toggle */}
                                    <div className="px-6 pb-3">
                                        <div className="flex p-1 gap-1 rounded-2xl bg-white/5 border border-white/10">
                                            <button
                                                onClick={() => setIsFlipped(false)}
                                                className={cn(
                                                    'flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                                                    !isFlipped
                                                        ? 'bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/20'
                                                        : 'text-white/40 hover:text-white/70'
                                                )}
                                            >
                                                Create Account
                                            </button>
                                            <button
                                                onClick={() => setIsFlipped(true)}
                                                className={cn(
                                                    'flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                                                    isFlipped
                                                        ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/20'
                                                        : 'text-white/40 hover:text-white/70'
                                                )}
                                            >
                                                Sign In
                                            </button>
                                        </div>
                                    </div>

                                    {/* Flip card — each face clips the full-page component */}
                                    <div className="overflow-hidden" style={{ perspective: '1400px', height: '440px' }}>
                                        <motion.div
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ transformStyle: 'preserve-3d', height: '100%', position: 'relative' }}
                                        >
                                            {/* FRONT — SignUp */}
                                            <div
                                                className="absolute inset-0 overflow-auto"
                                                style={{ backfaceVisibility: 'hidden' }}
                                            >
                                                <SignUp />
                                            </div>

                                            {/* BACK — SignIn */}
                                            <div
                                                className="absolute inset-0 overflow-auto"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                }}
                                            >
                                                <SignIn />
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: CREATING ═══════════════════ */}
                            {step === 'creating' && (
                                <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }}
                                    className="flex flex-col items-center justify-center py-20 gap-6 px-8"
                                >
                                    {/* Animated ring */}
                                    <div className="relative w-20 h-20">
                                        <div className="w-20 h-20 rounded-full border-2 border-white/10" />
                                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                        <div className="absolute inset-0 rounded-full border-t-2 border-violet-400 animate-spin [animation-duration:1.8s] opacity-50" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Cpu size={26} className="text-primary" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-lg uppercase tracking-widest text-white">{name}</p>
                                        <p className="text-sm text-white/40 mt-1 font-medium">Generating policies · Deploying agent…</p>
                                    </div>

                                    {/* Animated dots */}
                                    <div className="flex gap-1.5">
                                        {[0, 0.15, 0.3].map((delay, i) => (
                                            <motion.div key={i}
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
