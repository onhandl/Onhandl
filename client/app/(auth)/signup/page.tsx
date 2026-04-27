'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api';
import { AuthUI, OtpVerifyForm } from '@/components/ui/auth-fuse';

type Step = 'form' | 'otp';

export default function SignupPage() {
    const [step, setStep] = useState<Step>('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = async ({ username, password }: { username: string; password: string }) => {
        setError('');
        setLoading(true);
        try {
            await authApi.login({ username, password });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async ({ username, email, password }: { username: string; email: string; password: string }) => {
        setError('');
        setLoading(true);
        try {
            const res = await authApi.register({ username, email, password });
            if (res.requiresVerification) {
                setPendingEmail(email);
                setStep('otp');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (code: string) => {
        setError('');
        setLoading(true);
        try {
            await authApi.verifyEmail({ email: pendingEmail, code });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'otp') {
        return (
            <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 bg-background">
                <div className="w-full max-w-[400px] rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 p-5 sm:p-8">
                    <OtpVerifyForm
                        email={pendingEmail}
                        purpose="signup"
                        onSubmit={handleVerifyOtp}
                        onBack={() => { setStep('form'); setError(''); }}
                        error={error}
                        loading={loading}
                    />
                </div>
            </div>
        );
    }

    return (
        <AuthUI
            defaultSignIn={false}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            error={error}
            loading={loading}
        />
    );
}
