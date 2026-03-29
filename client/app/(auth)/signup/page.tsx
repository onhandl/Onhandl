'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password }),
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
                    <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Join FlawLess today</p>
                </div>

                {error && <div className="text-destructive text-sm text-center">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary px-4 py-3 text-primary-foreground font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/signin" className="text-primary font-medium hover:underline">
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
}