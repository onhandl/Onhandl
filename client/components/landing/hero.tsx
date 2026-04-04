'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { ContainerTextFlip } from "@/components/ui/overlays/container-text-flip";
import { cn } from "@/lib/utils";

export function ContainerTextFlipDemo() {
  const words = ["Anyone", "Everyone", "Anything"];
  return (
    <motion.span
      initial={{
        opacity: 0,
      }}
      whileInView={{
        opacity: 1,
      }}
      className={cn(
        "relative mb-6 max-w-2xl text-left text-4xl leading-normal font-bold tracking-tight text-zinc-700 md:text-7xl dark:text-zinc-100",
      )}
      layout
    >
      <span className="inline-block">
        <ContainerTextFlip words={words} />
        {/* <Blips /> */}
      </span>
    </motion.span>
  );
}


interface HeroProps {
  handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export const Hero: React.FC<HeroProps> = ({ handleAnchorClick }) => {
  const shouldReduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex flex-col items-start justify-center overflow-hidden pt-14 bg-fl-base">
      {/* Subtle dot grid — very low opacity so text stays readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--fl-line) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.25,
        }}
        aria-hidden
      />

      {/* Soft accent bloom — top-right only, far from text */}
      <div
        className="absolute top-0 right-0 w-[560px] h-[560px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(239,111,46,0.07) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-9 w-full py-20">

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="flex items-center gap-2 mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-fl-accent" />
          <span className="label-factory">Agent-Native Visual Workflow Builder</span>
        </motion.div>

        {/* Main heading — both lines dark for full readability */}
        <motion.h1
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06, ease }}
          className="text-[60px] md:text-[76px] lg:text-[92px] font-normal leading-none tracking-factory-h1 text-fl-ink max-w-[900px] mb-2"
        >
          <ContainerTextFlipDemo /> Should
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="text-[60px] md:text-[76px] lg:text-[92px] font-normal leading-none tracking-factory-h1 text-fl-accent mb-10"
        >
          have an AGENT
        </motion.h1>

        {/* Sub-heading */}
        <motion.p
          initial={{ opacity: 0, y: shouldReduce ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease }}
          className="text-[16px] md:text-[18px] text-fl-ink-2 max-w-[500px] leading-relaxed mb-10"
        >
          Connect your tools, define your logic, deploy — no engineering team required.
          From idea to live AI agent in minutes.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26, ease }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8"
        >
          <a href="/signup" className="btn-fl-primary text-[14px] px-5 h-10">
            Start Building
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <a
            href="#how-it-works"
            className="btn-fl-outline text-[14px] px-5 h-10"
            onClick={(e) => handleAnchorClick(e, '#how-it-works')}
          >
            See how it works
          </a>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.38, ease }}
          className="text-[12px] text-fl-ink-3"
        >
          Free 14-day trial · No credit card required · Cancel anytime
        </motion.p>

        {/* Divider + trusted by */}
        <div className="mt-16 rule-factory w-full max-w-[900px]" />
        <p className="label-factory mt-6 mb-5" style={{ color: 'var(--fl-ink-3)' }}>
          Trusted by teams building the future
        </p>
        <div className="flex flex-wrap items-center gap-8">
          {['Builders', 'Startups', 'Enterprises', 'Developers'].map((name) => (
            <span key={name} className="text-[14px] font-medium text-fl-line-2">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
