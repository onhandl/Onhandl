'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { OtpInput } from '@/components/ui/forms/otp-input';
import { ShieldCheck, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VerifyEmailProps {
    onSuccess?: () => void;
    initialEmail?: string;
    isModal?: boolean;
}

export function VerifyEmailContent({ onSuccess, initialEmail, isModal }: VerifyEmailProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState(initialEmail || '');
    const [code, setCode] = useState('');

    useEffect(() => {
        if (!initialEmail) {
            const emailParam = searchParams.get('email');
            if (emailParam) setEmail(emailParam);
        }
    }, [searchParams, initialEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const trimmedEmail = email.trim();
        const trimmedCode = code.trim();
        try {
            await authApi.verifyEmail({ email: trimmedEmail, code: trimmedCode });
            toast.success('Email verified!', { description: 'Welcome to Onhandl.' });
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error('Verification failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) { toast.error('Email is required'); return; }
        setResending(true);
        try {
            await authApi.resendVerification(email);
            toast.success('Verification code resent', { description: 'Please check your inbox.' });
        } catch (error: any) {
            toast.error('Failed to resend code', { description: error.message });
        } finally {
            setResending(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center",
            !isModal && "min-h-screen bg-muted/30 px-4"
        )}>
            <div className={cn(
                "w-full max-w-md space-y-6 bg-background rounded-3xl border border-border shadow-2xl transition-all",
                isModal ? "p-4 border-none shadow-none" : "p-8"
            )}>
                <div className="text-center">
                    <div className={cn(
                        "bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4",
                        isModal ? "w-10 h-10" : "w-12 h-12"
                    )}>
                        <ShieldCheck size={isModal ? 24 : 28} />
                    </div>
                    <h1 className={cn("font-black tracking-tight uppercase", isModal ? "text-xl" : "text-2xl")}>
                        Verify your email
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium px-4">
                        We've sent a code to <span className="text-foreground font-bold break-all">{email || 'your email'}</span>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        {!email && (
                            <div className="space-y-2 mb-4">
                                <Label>Email Address</Label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="rounded-2xl h-12"
                                />
                            </div>
                        )}
                        {!isModal && <Label>Verification Code</Label>}
                        <OtpInput
                            value={code}
                            onChange={setCode}
                            disabled={loading}
                            className="mt-2"
                        />
                    </div>
                    <Button
                        disabled={loading || resending || code.length < 6}
                        type="submit"
                        className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Verify Account'}
                    </Button>
                </form>

                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground font-medium">
                        Didn't receive a code? <br className={isModal ? "block" : "hidden"} />
                        <button
                            type="button"
                            disabled={resending}
                            onClick={handleResend}
                            className="text-primary font-bold hover:underline disabled:opacity-50"
                        >
                            {resending ? 'Sending...' : 'Resend code'}
                        </button>
                    </p>
                    {!isModal && (
                        <Link href="/signup" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Signup
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmail(props: VerifyEmailProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent {...props} />
        </Suspense>
    );
}
