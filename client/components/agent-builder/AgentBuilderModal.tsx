'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Cpu, Wand2, Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api';
import { financialAgentApi } from '@/api/financial.api';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';
import SignUp from '@/app/(auth)/signup/page';
import SignIn from '@/app/(auth)/signin/page';
import VerifyEmail from '@/app/(auth)/verify-email/page';

const DRAFT_KEY = 'onhandl_agent_draft';

type Step = 'name' | 'description' | 'auth' | 'verify_otp' | 'creating';

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
    const { refreshWorkspaces } = useWorkspace();
    const [step, setStep] = useState<Step>('name');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
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
        setSignupEmail('');
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
            await refreshWorkspaces();
            await createAgent({ name, description });
        } catch {
            setStep('auth');
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const handleAuthSuccess = async () => {
        setIsAuthenticated(true);
        // Ensure workspace is initialized before creating the agent
        await refreshWorkspaces();
        // Small delay to ensure localStorage is synced if needed
        await new Promise(r => setTimeout(r, 100));
        await createAgent({ name, description });
    };

    const handleSignUpSuccess = (email: string) => {
        setSignupEmail(email);
        setStep('verify_otp');
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
                    {/* Blurred backdrop with secondary color */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#020202]/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal shell - Dominant background */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease }}
                        className="relative w-full max-w-xl rounded-2xl border border-[#020202]/10 bg-[#eeeeee] shadow-2xl overflow-hidden"
                    >
                        <AnimatePresence mode="wait">

                            {/* ═══════════════════ STEP: NAME ═══════════════════ */}
                            {step === 'name' && (
                                <motion.div key="name" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease }}>
                                    <div className="p-8">
                                        {/* Close */}
                                        <button onClick={handleClose} className="absolute top-5 right-5 p-2 rounded-xl text-[#020202]/40 hover:text-[#020202] hover:bg-[#020202]/5 transition-all">
                                            <X size={20} />
                                        </button>

                                        {/* Header */}
                                        <div className="mb-8">
                                            <p className="text-xs font-black uppercase tracking-widest text-[#e0692e] mb-1">Step 1 of 2</p>
                                            <h2 className="text-2xl font-black tracking-tight text-[#020202]">Name Your Agent</h2>
                                        </div>

                                        <p className="text-sm text-[#020202]/70 font-medium mb-6 leading-relaxed">
                                            Give your agent an identity — a name it will carry inside your Financial Studio.
                                        </p>

                                        <div className="space-y-2 mb-8">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#020202]/70">Agent Name</label>
                                            <input
                                                autoFocus
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                                                placeholder="e.g. Treasury Sentinel"
                                                className="w-full h-14 px-5 rounded-xl bg-white border-2 border-[#020202]/10 text-[#020202] placeholder:text-[#020202]/30 focus:outline-none focus:border-[#e0692e] focus:ring-0 text-[15px] font-bold transition-all shadow-sm"
                                            />
                                        </div>

                                        <button
                                            onClick={handleNameNext}
                                            className="w-full h-14 rounded-xl bg-[#e0692e] text-white font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#e0692e]/90 transition-all shadow-[0_8px_20px_rgba(224,105,46,0.3)]"
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: DESCRIPTION ═══════════════════ */}
                            {step === 'description' && (
                                <motion.div key="desc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease }}>
                                    <div className="p-8">
                                        <button onClick={handleClose} className="absolute top-5 right-5 p-2 rounded-xl text-[#020202]/40 hover:text-[#020202] hover:bg-[#020202]/5 transition-all">
                                            <X size={20} />
                                        </button>

                                        <div className="mb-6">
                                            <p className="text-xs font-black uppercase tracking-widest text-[#e0692e] mb-1">Step 2 of 2</p>
                                            <h2 className="text-2xl font-black tracking-tight text-[#020202]">Define the Mission</h2>
                                        </div>

                                        <p className="text-sm text-[#020202]/70 font-medium mb-6 leading-relaxed">
                                            Describe what <span className="font-bold text-[#020202]">{name}</span> should do in plain language. Onhandl converts it into a live financial policy.
                                        </p>

                                        <div className="space-y-2 mb-8">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#020202]/70">Mission</label>
                                            <textarea
                                                autoFocus
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="e.g. Save 30% of incoming CKB and forward the rest to my cold wallet…"
                                                className="w-full min-h-[140px] px-5 py-4 rounded-xl bg-white border-2 border-[#020202]/10 text-[#020202] placeholder:text-[#020202]/30 focus:outline-none focus:border-[#e0692e] focus:ring-0 text-[15px] font-medium resize-none transition-all leading-relaxed shadow-sm"
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={() => setStep('name')} className="h-14 px-6 rounded-xl bg-white border-2 border-[#020202]/10 text-[15px] font-bold text-[#020202]/60 hover:text-[#020202] hover:border-[#020202]/20 transition-all flex items-center gap-2 shadow-sm">
                                                <ArrowLeft size={18} /> Back
                                            </button>
                                            <button
                                                onClick={handleDescriptionNext}
                                                disabled={isCheckingAuth}
                                                className="flex-1 h-14 rounded-xl bg-[#e0692e] text-white font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#e0692e]/90 disabled:opacity-50 transition-all shadow-[0_8px_20px_rgba(224,105,46,0.3)]"
                                            >
                                                {isCheckingAuth
                                                    ? <><span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Checking…</>
                                                    : <><Wand2 size={18} /> Create Agent</>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: AUTH ═══════════════════ */}
                            {step === 'auth' && (
                                <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease }}>

                                    {/* Header & Controls */}
                                    <div className="pt-6 px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e0692e]/10 border border-[#e0692e]/20 text-[#e0692e]">
                                            <Sparkles size={16} />
                                            <span className="text-xs font-bold">Draft saved: {name}</span>
                                        </div>
                                        <button onClick={handleClose} className="p-2 rounded-xl text-[#020202]/40 hover:text-[#020202] hover:bg-[#020202]/5 transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Sign Up / Sign In pill toggle */}
                                    <div className="px-6 py-4">
                                        <div className="flex p-1 gap-1 rounded-xl bg-[#020202]/5 border border-[#020202]/10">
                                            <button
                                                onClick={() => setIsFlipped(false)}
                                                className={cn(
                                                    'flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                                                    !isFlipped
                                                        ? 'bg-white text-[#020202] shadow-sm'
                                                        : 'text-[#020202]/50 hover:text-[#020202]'
                                                )}
                                            >
                                                Create Account
                                            </button>
                                            <button
                                                onClick={() => setIsFlipped(true)}
                                                className={cn(
                                                    'flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                                                    isFlipped
                                                        ? 'bg-white text-[#020202] shadow-sm'
                                                        : 'text-[#020202]/50 hover:text-[#020202]'
                                                )}
                                            >
                                                Sign In
                                            </button>
                                        </div>
                                    </div>

                                    {/* Flip card — each face clips the full-page component */}
                                    <div className="overflow-hidden bg-[#eeeeee]" style={{ perspective: '1400px', height: '480px' }}>
                                        <motion.div
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ transformStyle: 'preserve-3d', height: '100%', position: 'relative' }}
                                        >
                                            {/* FRONT — SignUp */}
                                            <div
                                                className="absolute inset-0 overflow-auto"
                                                style={{ backfaceVisibility: 'hidden' }}
                                            >
                                                <div className="scale-95 origin-top pt-2">
                                                    <SignUp onSuccess={handleSignUpSuccess} />
                                                </div>
                                            </div>

                                            {/* BACK — SignIn */}
                                            <div
                                                className="absolute inset-0 overflow-auto"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                }}
                                            >
                                                <div className="scale-95 origin-top pt-2">
                                                    <SignIn onSuccess={handleAuthSuccess} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: VERIFY OTP ═══════════════════ */}
                            {step === 'verify_otp' && (
                                <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease }}>
                                    <div className="pt-6 px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e0692e]/10 border border-[#e0692e]/20 text-[#e0692e]">
                                            <ShieldCheck size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Verification Required</span>
                                        </div>
                                        <button onClick={handleClose} className="p-2 rounded-xl text-[#020202]/40 hover:text-[#020202] hover:bg-[#020202]/5 transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto bg-[#eeeeee] max-h-[520px]">
                                        <div className="pt-2 pb-6">
                                            <VerifyEmail
                                                isModal
                                                initialEmail={signupEmail}
                                                onSuccess={handleAuthSuccess}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════════ STEP: CREATING ═══════════════════ */}
                            {step === 'creating' && (
                                <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }}
                                    className="flex flex-col items-center justify-center py-24 gap-6 px-8"
                                >
                                    {/* Animated ring */}
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 rounded-full border-4 border-[#020202]/10" />
                                        <div className="absolute inset-0 rounded-full border-t-4 border-[#e0692e] animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Cpu size={28} className="text-[#e0692e]" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-xl tracking-tight text-[#020202]">{name}</p>
                                        <p className="text-sm text-[#020202]/50 mt-2 font-medium">Generating policies · Deploying agent…</p>
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
