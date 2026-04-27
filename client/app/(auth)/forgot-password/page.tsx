'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { KeyRound, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.forgotPassword({ email });
            setSubmitted(true);
            toast.success('Reset link sent!');
        } catch (error: any) {
            toast.error('Request failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-3xl border border-border shadow-2xl text-center">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Check your email</h1>
                    <p className="text-muted-foreground text-sm mt-2 font-medium">
                        We've sent a password reset link to <span className="text-foreground font-bold">{email}</span>.
                    </p>
                    <div className="pt-6 space-y-4">
                        <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                            <Button className="w-full rounded-2xl h-12 font-bold bg-primary text-white">
                                Enter Reset Code
                            </Button>
                        </Link>
                        <Link href="/signin">
                            <Button variant="ghost" className="w-full rounded-2xl h-12 font-bold text-muted-foreground">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-3xl border border-border shadow-2xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={28} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Forgot Password?</h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium">No worries, we'll send you reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
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
                    <Button disabled={loading} type="submit" className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
                    </Button>
                </form>

                <div className="text-center">
                    <Link href="/signin" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
