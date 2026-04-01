'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Users, Loader2 } from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

const TOTAL_SPOTS = 6_000;

const benefits = [
    '25% lifetime discount',
    'Exclusive beta features',
    'Direct product team access',
    'Shape the roadmap',
];

export const Waitlist: React.FC = () => {
    const shouldReduce = useReducedMotion();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [count, setCount] = useState<number | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/waitlist/count`)
            .then((r) => r.json())
            .then((d) => setCount(d.count))
            .catch(() => setCount(null));
    }, []);

    const filledPct = count !== null ? Math.min((count / TOTAL_SPOTS) * 100, 100) : 88;
    const displayCount = count !== null ? count.toLocaleString() : '5,287';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/waitlist/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), source: 'landing' }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    setError("You're already on the waitlist — we'll be in touch soon!");
                } else {
                    setError(data.error || 'Something went wrong. Please try again.');
                }
                return;
            }
            if (data.count !== undefined) setCount(data.count);
            setSubmitted(true);
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="waitlist" className="py-28 bg-muted/20 relative overflow-hidden">
            {/* Background depth */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-primary/6 blur-[100px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left — copy */}
                        <motion.div
                            initial={{ opacity: 0, x: shouldReduce ? 0 : -32 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
                                Early Access
                            </p>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                                Join the waitlist
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                                Be among the first to experience the future of AI agent building. Beta
                                launches soon — spots are limited.
                            </p>

                            <ul className="space-y-3 mb-10">
                                {benefits.map((b) => (
                                    <li key={b} className="flex items-center gap-3 text-[15px]">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-primary" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            {/* Progress bar */}
                            <div className="p-5 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">
                                        {displayCount} of {TOTAL_SPOTS.toLocaleString()} spots filled
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${filledPct}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: shouldReduce ? 0 : 1.2, ease: 'easeOut', delay: 0.3 }}
                                        className="h-full rounded-full bg-primary"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Right — form */}
                        <motion.div
                            initial={{ opacity: 0, x: shouldReduce ? 0 : 32 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="p-8 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">You're on the list!</h3>
                                        <p className="text-muted-foreground text-sm">
                                            We'll notify you the moment your spot is ready.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form className="space-y-5" onSubmit={handleSubmit}>
                                        <div>
                                            <label htmlFor="wl-name" className="block text-sm font-medium mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                ref={nameRef}
                                                id="wl-name"
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/70 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-base"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="wl-email" className="block text-sm font-medium mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                id="wl-email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/70 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-base"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                                {error}
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Secure Your Spot
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-muted-foreground text-center">
                                            No spam, unsubscribe at any time.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    );
};
