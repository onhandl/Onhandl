'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { OtpInput } from '@/components/ui/forms/otp-input';
import { ShieldCheck, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(emailParam);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.verifyEmail({ email, code });
            toast.success('Email verified!', { description: 'Welcome to Onhandl.' });
            router.push('/dashboard');
        } catch (error: any) {
            toast.error('Verification failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-3xl border border-border shadow-2xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Verify your email</h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium">
                        We've sent a code to <span className="text-foreground font-bold">{email || 'your email'}</span>.
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
                        <Label>Verification Code</Label>
                        <OtpInput
                            value={code}
                            onChange={setCode}
                            disabled={loading}
                            className="mt-2"
                        />
                    </div>
                    <Button disabled={loading || code.length < 6} type="submit" className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : 'Verify Account'}
                    </Button>
                </form>

                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Didn't receive a code? <button onClick={() => toast.info('Please check your spam folder or wait a moment.')} className="text-primary font-bold hover:underline">Resend code</button>
                    </p>
                    <Link href="/signup" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Signup
                    </Link>
                </div>
            </div>
        </div>
    );
}
