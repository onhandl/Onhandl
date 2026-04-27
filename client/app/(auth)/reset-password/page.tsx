'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { OtpInput } from '@/components/ui/forms/otp-input';
import { KeyRound, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setForm(prev => ({ ...prev, email: emailParam }));
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            await authApi.resetPassword({
                email: form.email,
                code: form.code,
                newPassword: form.newPassword
            });
            toast.success('Password updated!', { description: 'Please log in with your new password.' });
            router.push('/signin');
        } catch (error: any) {
            toast.error('Reset failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-3xl border border-border shadow-2xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={28} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Reset Password</h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium">Enter the code from your email and your new password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                            required
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="rounded-2xl h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Reset Code</Label>
                        <OtpInput
                            value={form.code}
                            onChange={c => setForm({ ...form, code: c })}
                            disabled={loading}
                            className="mt-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={form.newPassword}
                            onChange={e => setForm({ ...form, newPassword: e.target.value })}
                            className="rounded-2xl h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            className="rounded-2xl h-12"
                        />
                    </div>
                    <Button disabled={loading || form.code.length < 6} type="submit" className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
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
