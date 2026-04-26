'use client';

import React from 'react';
import Link from "next/link";
import {
  Mail, X, Instagram, Facebook as FacebookIcon,
  Linkedin, Youtube, Heart, Zap
} from "lucide-react";
import ThemeToggle from "@/components/ui/footer";

const navigation = {
  categories: [
    {
      id: "onhandl",
      name: "Onhandl",
      sections: [
        {
          id: "platform",
          name: "Platform",
          items: [
            { name: "Dashboard", href: "/dashboard" },
          ],
        },
        {
          id: "resources",
          name: "Resources",
          items: [
            { name: "Documentation", href: "#" },
            { name: "News & API", href: "#" },
            { name: "Guide", href: "#" },
            { name: "Status", href: "#" },
          ],
        },
        {
          id: "company",
          name: "Company",
          items: [
            { name: "About Us", href: "#" },
            { name: "Careers", href: "#" },
            { name: "Enterprise", href: "#" },
            { name: "Security", href: "#" },
          ],
        },
        {
          id: "legal",
          name: "Legal",
          items: [
            { name: "Privacy Policy", href: "#" },
            { name: "Terms of Service", href: "#" },
            { name: "Cookie Policy", href: "#" },
            { name: "Compliance", href: "#" },
          ],
        },
        {
          id: "community",
          name: "Social",
          items: [
            { name: "X (Twitter)", href: "#" },
            { name: "LinkedIn", href: "#" },
            { name: "GitHub", href: "#" },
            { name: "Discord", href: "#" },
          ],
        },
        {
          id: "support",
          name: "Support",
          items: [
            { name: "Help Center", href: "#" },
            { name: "Contact Sales", href: "#" },
            { name: "System Status", href: "#" },
            { name: "Feedback", href: "#" },
          ],
        },
      ],
    },
  ],
};

const Underline = `hover:-translate-y-1 border border-dotted border-border rounded-xl p-2.5 transition-transform flex items-center justify-center bg-card/50`;

const LogoMark: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden className="text-fl-accent">
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="border-border/20 mx-auto w-full border-b border-t px-2 bg-fl-base">
      <div className="relative mx-auto grid max-w-7xl items-center justify-center gap-6 p-10 pb-0 md:flex">
        <Link href="/">
          <div className="flex items-center justify-center rounded-full">
            <LogoMark />
          </div>
        </Link>
        <p className="bg-transparent text-center text-xs leading-5 text-fl-ink-2 md:text-left max-w-3xl">
          Onhandl is the autonomous sovereign layer for financial intent. We empower builders to deploy agents that manage,
          secure, and move assets with precision and trust. Built for the future of on-chain operations,
          Onhandl provides the infrastructure for seamless, secure, and automated financial agents.
          Your assets, your logic, our security.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-dotted border-border"></div>
        <div className="py-10">
          {navigation.categories.map((category) => (
            <div
              key={category.name}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 justify-between gap-6 leading-6"
            >
              {category.sections.map((section) => (
                <div key={section.id}>
                  <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-fl-accent mb-4">
                    {section.name}
                  </h6>
                  <ul
                    role="list"
                    className="flex flex-col space-y-2"
                  >
                    {section.items.map((item) => (
                      <li key={item.name} className="flow-root">
                        <Link
                          href={item.href}
                          className="text-xs text-fl-ink-2 hover:text-fl-ink transition-colors font-medium"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border-b border-dotted border-border"></div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 px-6 mt-4">
          <Link
            aria-label="Email"
            href="mailto:contact@onhandl.com"
            className={Underline}
          >
            <Mail strokeWidth={1.5} className="h-4 w-4" />
          </Link>
          <Link
            aria-label="X"
            href="#"
            className={Underline}
          >
            <X className="h-4 w-4" />
          </Link>
          <Link
            aria-label="LinkedIn"
            href="#"
            className={Underline}
          >
            <Linkedin className="h-4 w-4" />
          </Link>
          <Link
            aria-label="GitHub"
            href="#"
            className={Underline}
          >
            <Zap className="h-4 w-4" />
          </Link>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-auto mb-10 mt-6 flex flex-col justify-between text-center text-[10px] md:max-w-7xl font-bold uppercase tracking-widest text-fl-ink-3">
        <div className="flex flex-row items-center justify-center gap-1">
          <span> © </span>
          <span>{new Date().getFullYear()}</span>
          <span>Made with</span>
          <Heart className="text-fl-accent mx-1 h-3 w-3 animate-pulse" />
          <span> for </span>
          <span className="text-fl-ink px-1">AI Builders</span>
          -
          <Link href="/" className="ml-1 hover:text-fl-accent transition-colors">
            Onhandl
          </Link>
        </div>
      </div>
    </footer>
  );
}
