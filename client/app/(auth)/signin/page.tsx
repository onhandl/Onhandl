'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { AuthUI, ForgotPasswordForm, OtpVerifyForm, ResetPasswordForm } from '@/components/ui/auth-fuse';

type Step = 'form' | 'signup-otp' | 'forgot' | 'reset-otp' | 'reset-pw';

export default function SigninPage() {
    const [step, setStep] = useState<Step>('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const router = useRouter();

    const clearError = () => setError('');

    const handleSignIn = async ({ username, password }: { username: string; password: string }) => {
        clearError();
        setLoading(true);
        try {
            await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async ({ username, email, password }: { username: string; email: string; password: string }) => {
        clearError();
        setLoading(true);
        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password }),
            });
            if (res.requiresVerification) {
                setPendingEmail(email);
                setStep('signup-otp');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (email: string) => {
        clearError();
        setLoading(true);
        try {
            await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setPendingEmail(email);
            setStep('reset-otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyResetOtp = async (code: string) => {
        clearError();
        // Just store code and advance — actual reset happens in next step
        setResetCode(code);
        setStep('reset-pw');
    };

    const handleResetPassword = async (newPassword: string) => {
        clearError();
        setLoading(true);
        try {
            await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email: pendingEmail, code: resetCode, newPassword }),
            });
            setStep('form');
            setError('');
        } catch (err: any) {
            setError(err.message);
            setStep('reset-otp'); // send them back to re-enter code on failure
        } finally {
            setLoading(false);
        }
    };

    const wrapper = (children: React.ReactNode) => (
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 bg-background">
            <div className="w-full max-w-[400px] rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 p-5 sm:p-8">{children}</div>
        </div>
    );

    if (step === 'signup-otp') {
        return wrapper(
            <OtpVerifyForm
                email={pendingEmail}
                purpose="signup"
                onSubmit={async (code) => {
                    clearError();
                    setLoading(true);
                    try {
                        await apiFetch('/auth/verify-email', {
                            method: 'POST',
                            body: JSON.stringify({ email: pendingEmail, code }),
                        });
                        router.push('/dashboard');
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                }}
                onBack={() => { setStep('form'); clearError(); }}
                error={error}
                loading={loading}
            />
        );
    }

    if (step === 'forgot') {
        return wrapper(
            <ForgotPasswordForm
                onSubmit={handleForgotPassword}
                onBack={() => { setStep('form'); clearError(); }}
                error={error}
                loading={loading}
            />
        );
    }

    if (step === 'reset-otp') {
        return wrapper(
            <OtpVerifyForm
                email={pendingEmail}
                purpose="forgot_password"
                onSubmit={handleVerifyResetOtp}
                onBack={() => { setStep('forgot'); clearError(); }}
                error={error}
                loading={loading}
            />
        );
    }

    if (step === 'reset-pw') {
        return wrapper(
            <ResetPasswordForm
                onSubmit={handleResetPassword}
                error={error}
                loading={loading}
            />
        );
    }

    return (
        <AuthUI
            defaultSignIn={true}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onForgotPassword={() => { clearError(); setStep('forgot'); }}
            error={error}
            loading={loading}
        />
    );
}
