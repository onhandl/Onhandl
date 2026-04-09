'use client';

import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const footerLinks = {
    Resources: [
        { label: 'News', href: '#' },
        { label: 'Docs', href: '#' },
        { label: 'Contact Sales', href: '#' },
    ],
    Company: [
        { label: 'About Us', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Enterprise', href: '#' },
        { label: 'Security', href: '#' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ],
};

const socials = [
    { icon: Twitter, label: 'X (Twitter)', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Github, label: 'GitHub', href: '#' },
];

const LogoMark: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

export const Footer: React.FC = () => {
    return (
        <footer className="bg-fl-dark border-t border-fl-line-dark">
            <div className="max-w-[1400px] mx-auto px-9 pt-16 pb-10">

                {/* Top row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-2">
                        <a href="/" className="inline-flex items-center gap-2 text-fl-ink-inv hover:opacity-70 transition-opacity mb-4">
                            <LogoMark />
                            <span className="text-sm font-medium tracking-tight">Onhandl</span>
                        </a>
                        <p className="text-[13px] text-fl-ink-3 leading-relaxed mb-6 max-w-[240px]">
                            Build powerful AI agents without code. Automate your workflows effortlessly.
                        </p>
                        <div className="flex items-center gap-3">
                            {socials.map(({ icon: Icon, label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-8 h-8 border border-fl-line-dark rounded-[4px] flex items-center justify-center text-fl-ink-3 hover:text-fl-ink-inv hover:border-fl-ink-3 transition-all cursor-pointer"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([group, links]) => (
                        <div key={group}>
                            <h5 className="text-[11px] font-normal uppercase tracking-[0.06em] text-fl-ink-3 mb-4">
                                {group}
                            </h5>
                            <ul className="space-y-3">
                                {links.map(({ label, href }) => (
                                    <li key={label}>
                                        <a
                                            href={href}
                                            className="text-[13px] text-fl-ink-3 hover:text-fl-ink-inv transition-colors cursor-pointer"
                                        >
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="h-px bg-fl-line-dark mb-8" />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[11px] text-fl-ink-3">
                        © {new Date().getFullYear()} Onhandl. All rights reserved.
                    </p>
                    <p className="text-[11px] text-fl-ink-3">
                        Built for AI builders everywhere.
                    </p>
                </div>
            </div>
        </footer>
    );
};
