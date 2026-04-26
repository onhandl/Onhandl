'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

import { getPublicApiBaseUrl } from '@/lib/api-public';

interface NavigationProps {
    isMobileMenuOpen?: boolean;
    setIsMobileMenuOpen?: (open: boolean) => void;
    handleAnchorClick?: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
];

const LogoMark: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

export const Navigation: React.FC<NavigationProps> = ({
    isMobileMenuOpen: externalOpen,
    setIsMobileMenuOpen: externalSetOpen,
    handleAnchorClick,
}) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isMobileMenuOpen = externalOpen ?? internalOpen;
    const setIsMobileMenuOpen = externalSetOpen ?? setInternalOpen;

    const [scrolled, setScrolled] = useState(false);
    const [isAuthenticated, setIsAuth] = useState<boolean | null>(null);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        fetch(`${getPublicApiBaseUrl()}/auth/me`, { credentials: 'include' })
            .then(r => setIsAuth(r.ok))
            .catch(() => setIsAuth(false));
    }, []);

    const onAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#') && handleAnchorClick) handleAnchorClick(e, href);
    };

    const navCls = scrolled
        ? 'bg-fl-base/80 backdrop-blur-md border-b border-fl-line/80 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] supports-[backdrop-filter]:bg-fl-base/70'
        : 'bg-fl-base/40 backdrop-blur-sm supports-[backdrop-filter]:bg-fl-base/25';

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${navCls}`}>
            <div className="max-w-[1400px] mx-auto px-9 h-14 flex items-center justify-between">

                {/* Logo */}
                <a href="/" className="flex items-center gap-2 text-fl-ink hover:opacity-65 transition-opacity">
                    <LogoMark />
                    <span className="text-[13px] font-medium tracking-tight">Onhandl</span>
                </a>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-7">
                    {navLinks.map(link => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-[12px] uppercase tracking-factory-nav text-fl-ink-2 hover:text-fl-ink transition-colors duration-150"
                            onClick={link.href.startsWith('#') ? e => onAnchorClick(e, link.href) : undefined}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Auth CTAs */}
                <div className="hidden md:flex items-center gap-2">
                    {isAuthenticated === null ? (
                        <div className="w-32 h-9" />
                    ) : isAuthenticated ? (
                        <a href="/dashboard" className="btn-fl-primary text-[13px]">Dashboard</a>
                    ) : (
                        <>
                            <a href="/signin" className="text-[13px] text-fl-ink-2 hover:text-fl-ink transition-colors px-3 py-2">
                                Log In
                            </a>
                            <a href="/signup" className="btn-fl-primary text-[13px]">Get Started</a>
                        </>
                    )}
                </div>

                {/* Mobile burger */}
                <button
                    className="md:hidden w-9 h-9 flex items-center justify-center text-fl-ink-2 hover:text-fl-ink transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-fl-base/95 backdrop-blur-md border-t border-fl-line shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                    <div className="max-w-[1400px] mx-auto px-9 py-4 flex flex-col">
                        {navLinks.map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="py-3 text-[12px] uppercase tracking-factory-nav text-fl-ink-2 hover:text-fl-ink border-b border-fl-line transition-colors"
                                onClick={e => { if (link.href.startsWith('#')) onAnchorClick(e, link.href); setIsMobileMenuOpen(false); }}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-4 flex flex-col gap-2">
                            {isAuthenticated ? (
                                <a href="/dashboard" className="btn-fl-primary text-center text-[13px]"
                                    onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a>
                            ) : (
                                <>
                                    <a href="/signin" className="btn-fl-outline text-center text-[13px]">Log In</a>
                                    <a href="/signup" className="btn-fl-primary text-center text-[13px]">Get Started</a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
