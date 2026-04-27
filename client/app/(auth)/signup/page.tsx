'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { UserPlus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

interface SignUpProps {
    onSuccess?: (email: string) => void;
}

export default function SignUp({ onSuccess }: SignUpProps = {}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.register(form);
            toast.success('Account created!', { description: 'Please verify your email.' });
            if (onSuccess) {
                onSuccess(form.email);
            } else {
                router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
            }
        } catch (error: any) {
            toast.error('Registration failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-3xl border border-border shadow-2xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={28} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Join Onhandl</h1>
                    <p className="text-muted-foreground text-sm mt-1 font-medium">Start your journey with autonomous agents</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                            required
                            placeholder="choose_a_name"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            className="rounded-2xl h-12"
                        />
                    </div>
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
                        <Label>Password</Label>
                        <Input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="rounded-2xl h-12"
                        />
                    </div>
                    <Button disabled={loading} type="submit" className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>}
                    </Button>
                </form>

                <p className="text-center text-sm font-medium text-muted-foreground">
                    Already have an account? <Link href="/signin" className="text-primary font-bold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
