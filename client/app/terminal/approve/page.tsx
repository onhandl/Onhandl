'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Terminal, Shield, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi, terminalApi, workspaceApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

function TerminalApproveContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setLoading(false);
            return;
        }

        async function init() {
            try {
                const [me, ws] = await Promise.all([
                    authApi.getMe(),
                    workspaceApi.getWorkspaces()
                ]);
                setUser(me);
                setWorkspaces(ws);
                if (ws.length > 0) setSelectedWorkspace(ws[0]._id);
            } catch (err) {
                router.push(`/signin?callback=/terminal/approve?token=${token}`);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [token, router]);

    const handleApprove = async () => {
        if (!token || !selectedWorkspace) return;
        setApproving(true);
        try {
            await terminalApi.approve({ token, workspaceId: selectedWorkspace });
            setStatus('success');
            toast.success('Terminal session authorized');
        } catch (err: any) {
            toast.error('Authorization failed', { description: err.message });
            setStatus('error');
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-lg space-y-8 bg-background p-10 rounded-[2.5rem] border border-border/50 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Terminal size={120} />
                </div>

                <div className="text-center relative z-10">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        {status === 'success' ? <CheckCircle size={32} /> :
                            status === 'error' ? <AlertCircle size={32} /> : <Shield size={32} />}
                    </div>

                    {status === 'success' ? (
                        <>
                            <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Authorized</h1>
                            <p className="text-muted-foreground font-medium">You can now close this window and return to your CLI.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Authorize Terminal</h1>
                            <p className="text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                                <Lock size={14} className="text-amber-500" /> CLI Session Request
                            </p>
                        </>
                    )}
                </div>

                {status === 'idle' && (
                    <div className="space-y-6 relative z-10 pt-4">
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">Identity</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-primary">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{user?.username}</p>
                                    <p className="text-[11px] font-medium text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Workspace context</label>
                            <div className="grid gap-2">
                                {workspaces.map(ws => (
                                    <button
                                        key={ws._id}
                                        onClick={() => setSelectedWorkspace(ws._id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                            selectedWorkspace === ws._id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-muted/20 hover:bg-muted/40"
                                        )}
                                    >
                                        <span className="text-sm font-bold">{ws.name}</span>
                                        {selectedWorkspace === ws._id && <CheckCircle size={16} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            disabled={approving || !selectedWorkspace}
                            onClick={handleApprove}
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            {approving ? <Loader2 className="animate-spin" /> : "Approve Session"}
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
                            Your terminal will have scoped access to this workspace only.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center pt-4">
                        <p className="text-sm font-medium text-destructive mb-6">Invalid or expired authorization token.</p>
                        <Button onClick={() => router.push('/dashboard')} variant="outline" className="rounded-2xl h-12 px-8 font-bold">Return Home</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TerminalApprovePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <TerminalApproveContent />
        </Suspense>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
