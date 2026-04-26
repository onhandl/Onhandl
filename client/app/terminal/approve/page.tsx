'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/api/api-client';
import { Button } from '@/components/ui/buttons/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Loader2 } from 'lucide-react';
import { AuthUI, ForgotPasswordForm, OtpVerifyForm, ResetPasswordForm } from '@/components/ui/auth-fuse';

type Step = 'form' | 'signup-otp' | 'forgot' | 'reset-otp' | 'reset-pw';

function TerminalApprovePageContent() {
    const searchParams = useSearchParams();
    const userCode = searchParams.get('userCode');

    const [user, setUser] = useState<any>(null);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Auth states
    const [step, setStep] = useState<Step>('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [resetCode, setResetCode] = useState('');

    const clearAuthError = () => setAuthError('');

    useEffect(() => {
        const init = async () => {
            try {
                const userData = await apiFetch('/auth/me');
                setUser(userData);
                const workspacesData = await apiFetch('/workspaces/workspaces');
                setWorkspaces(workspacesData);
            } catch (err) {
                setUser(null);
            } finally {
                setIsLoadingAuth(false);
            }
        };
        init();
    }, []);

    const initUser = async () => {
        try {
            const userData = await apiFetch('/auth/me');
            setUser(userData);
            const workspacesData = await apiFetch('/workspaces/workspaces');
            setWorkspaces(workspacesData);
        } catch (err) {
            setUser(null);
        }
    };

    const handleSignIn = async ({ username, password }: { username: string; password: string }) => {
        clearAuthError();
        setAuthLoading(true);
        try {
            await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            await initUser();
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignUp = async ({ username, email, password }: { username: string; email: string; password: string }) => {
        clearAuthError();
        setAuthLoading(true);
        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password }),
            });
            if (res.requiresVerification) {
                setPendingEmail(email);
                setStep('signup-otp');
            } else {
                await initUser();
            }
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleForgotPassword = async (email: string) => {
        clearAuthError();
        setAuthLoading(true);
        try {
            await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setPendingEmail(email);
            setStep('reset-otp');
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyResetOtp = async (code: string) => {
        clearAuthError();
        setResetCode(code);
        setStep('reset-pw');
    };

    const handleResetPassword = async (newPassword: string) => {
        clearAuthError();
        setAuthLoading(true);
        try {
            await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email: pendingEmail, code: resetCode, newPassword }),
            });
            setStep('form');
            setAuthError('');
        } catch (err: any) {
            setAuthError(err.message);
            setStep('reset-otp');
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        if (!userCode) {
            setStatus('error');
            setErrorMessage('Invalid session link: userCode is missing.');
        }
    }, [userCode]);

    if (isLoadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        if (step === 'signup-otp') {
            return (
                <div className="w-full min-h-screen flex items-center justify-center bg-black px-4 py-8">
                    <div className="w-full max-w-[400px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-5 sm:p-8">
                        <OtpVerifyForm
                            email={pendingEmail}
                            purpose="signup"
                            onSubmit={async (code) => {
                                clearAuthError();
                                setAuthLoading(true);
                                try {
                                    await apiFetch('/auth/verify-email', {
                                        method: 'POST',
                                        body: JSON.stringify({ email: pendingEmail, code }),
                                    });
                                    await initUser();
                                } catch (err: any) {
                                    setAuthError(err.message);
                                } finally {
                                    setAuthLoading(false);
                                }
                            }}
                            onBack={() => { setStep('form'); clearAuthError(); }}
                            error={authError}
                            loading={authLoading}
                        />
                    </div>
                </div>
            );
        }

        if (step === 'forgot') {
            return (
                <div className="w-full min-h-screen flex items-center justify-center bg-black px-4 py-8">
                    <div className="w-full max-w-[400px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-5 sm:p-8">
                        <ForgotPasswordForm
                            onSubmit={handleForgotPassword}
                            onBack={() => { setStep('form'); clearAuthError(); }}
                            error={authError}
                            loading={authLoading}
                        />
                    </div>
                </div>
            );
        }

        if (step === 'reset-otp') {
            return (
                <div className="w-full min-h-screen flex items-center justify-center bg-black px-4 py-8">
                    <div className="w-full max-w-[400px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-5 sm:p-8">
                        <OtpVerifyForm
                            email={pendingEmail}
                            purpose="forgot_password"
                            onSubmit={handleVerifyResetOtp}
                            onBack={() => { setStep('forgot'); clearAuthError(); }}
                            error={authError}
                            loading={authLoading}
                        />
                    </div>
                </div>
            );
        }

        if (step === 'reset-pw') {
            return (
                <div className="w-full min-h-screen flex items-center justify-center bg-black px-4 py-8">
                    <div className="w-full max-w-[400px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-5 sm:p-8">
                        <ResetPasswordForm
                            onSubmit={handleResetPassword}
                            error={authError}
                            loading={authLoading}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-black min-h-screen">
                {/* We override the AuthUI's internal wrapper bg if needed, or just let it use its default */}
                <AuthUI
                    onSignIn={handleSignIn}
                    onSignUp={handleSignUp}
                    onForgotPassword={() => { clearAuthError(); setStep('forgot'); }}
                    error={authError}
                    loading={authLoading}
                />
            </div>
        );
    }

    const handleApprove = async () => {
        if (!userCode) return;
        setStatus('loading');

        try {
            await apiFetch('/terminal/auth/approve', {
                method: 'POST',
                body: JSON.stringify({
                    userCode,
                    workspaceId: workspaces[0]?._id
                })
            });
            setStatus('success');
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to approve session. It may have expired.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
            <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 text-neutral-100 border shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-xl text-white">Onhandl Terminal Request</CardTitle>
                    <CardDescription className="text-neutral-400">
                        A terminal session is requesting access to your Onhandl account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'error' && (
                        <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                            {errorMessage}
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm font-medium">
                            Session approved! You may now close this window and return to your terminal.
                        </div>
                    )}

                    {(status === 'idle' || status === 'loading') && (
                        <div className="bg-neutral-950 p-6 rounded-xl font-mono text-center tracking-widest text-3xl border border-neutral-800 shadow-inner">
                            {userCode}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-2">
                    {status === 'idle' || status === 'error' || status === 'loading' ? (
                        <Button
                            className="w-full bg-white text-black hover:bg-neutral-200 py-6 text-base font-bold shadow-lg transition-all active:scale-95"
                            onClick={handleApprove}
                            disabled={status === 'loading' || !userCode}
                        >
                            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve Access
                        </Button>
                    ) : (
                        <div className="w-full space-y-3">
                            {status === 'success' && (
                                <Button
                                    className="w-full border border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                                    variant="outline"
                                    onClick={() => window.close()}
                                >
                                    Close Window
                                </Button>
                            )}
                            <Button
                                className="w-full bg-neutral-800 text-white hover:bg-neutral-700"
                                onClick={() => window.location.href = '/dashboard'}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

import { Suspense } from 'react';

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <TerminalApprovePageContent />
        </Suspense>
    );
}
