'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export default function SigninPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Welcome back to FlawLess</p>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignin} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-foreground placeholder:focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            placeholder="Enter your username or email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-foreground placeholder:focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary px-4 py-2.5 text-primary-foreground font-semibold hover:opacity-90 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        Sign In
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <a href="/signup" className="text-primary font-medium hover:underline transition-colors">
                        Sign up
                    </a>
                </div>
            </div>
        </div>
    );
}