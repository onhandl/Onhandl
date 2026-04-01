'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, LayoutDashboard } from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

interface NavigationProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const navLinks = ['Features', 'How It Works', 'Pricing', 'FAQ'];

export const Navigation: React.FC<NavigationProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    handleAnchorClick,
}) => {
    const [scrolled, setScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
            .then((r) => setIsAuthenticated(r.ok))
            .catch(() => setIsAuthenticated(false));
    }, []);

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-4 left-4 right-4 z-50 rounded-2xl transition-all duration-300 ${
                scrolled
                    ? 'bg-background/80 backdrop-blur-xl border border-border/60 shadow-xl shadow-black/10'
                    : 'bg-transparent border border-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40 transition-shadow duration-200">
                        <Zap className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="text-base font-bold tracking-tight">FlawLess</span>
                </a>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-0.5">
                    {navLinks.map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/40 transition-all duration-200 cursor-pointer"
                            onClick={(e) => handleAnchorClick(e, `#${item.toLowerCase().replace(/ /g, '-')}`)}
                        >
                            {item}
                        </a>
                    ))}
                    <a
                        href="/marketplace"
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/40 transition-all duration-200 cursor-pointer"
                    >
                        Marketplace
                    </a>
                    <a
                        href="/community"
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/40 transition-all duration-200 cursor-pointer"
                    >
                        Community
                    </a>
                </div>

                {/* CTA — swaps based on auth state */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated === null ? (
                        /* Loading — invisible placeholder to avoid layout shift */
                        <div className="w-32 h-9" />
                    ) : isAuthenticated ? (
                        <a
                            href="/dashboard"
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 cursor-pointer"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </a>
                    ) : (
                        <>
                            <a
                                href="/signin"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                            >
                                Sign In
                            </a>
                            <a
                                href="/signup"
                                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 cursor-pointer"
                            >
                                Get Started Free
                            </a>
                        </>
                    )}
                </div>

                {/* Mobile burger */}
                <button
                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border/40 rounded-b-2xl"
                    >
                        <div className="px-4 py-4 flex flex-col gap-1">
                            {navLinks.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                                    className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/40 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                        handleAnchorClick(e, `#${item.toLowerCase().replace(/ /g, '-')}`);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    {item}
                                </a>
                            ))}
                            <a
                                href="/marketplace"
                                className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/40 transition-colors cursor-pointer"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Marketplace
                            </a>
                            <a
                                href="/community"
                                className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/40 transition-colors cursor-pointer"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Community
                            </a>

                            {isAuthenticated ? (
                                <a
                                    href="/dashboard"
                                    className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl text-center shadow-md shadow-primary/25"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </a>
                            ) : (
                                <>
                                    <a
                                        href="/signin"
                                        className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-accent/40 transition-colors"
                                    >
                                        Sign In
                                    </a>
                                    <a
                                        href="/signup"
                                        className="mt-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl text-center shadow-md shadow-primary/25"
                                    >
                                        Get Started Free
                                    </a>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
