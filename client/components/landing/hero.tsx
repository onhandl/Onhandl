'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { ContainerTextFlipHeading } from '@/components/landing/hero/container-text-flip-heading';
import { landingEase } from '@/components/landing/motion-ease';

import dynamic from 'next/dynamic';

const LottieAnimation = dynamic(() => import('./hero/lottie-animation'), {
  ssr: false,
});

interface HeroProps {
  handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const ease = landingEase;

export const Hero: React.FC<HeroProps> = ({ handleAnchorClick }) => {
  const shouldReduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex flex-col items-start justify-center overflow-hidden pt-14 bg-fl-base">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--fl-line) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.25,
        }}
        aria-hidden
      />

      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[560px] h-[560px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, color-mix(in srgb, var(--fl-accent) 7%, transparent) 0%, transparent 70%)' }} aria-hidden />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] pointer-events-none opacity-90" style={{ background: 'radial-gradient(circle at bottom left, color-mix(in srgb, var(--fl-accent) 4%, transparent) 0%, transparent 65%)' }} aria-hidden />

      <div className="relative z-10 max-w-[1400px] mx-auto px-9 w-full py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 w-full">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="flex items-center gap-2 mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fl-accent" />
            <span className="label-factory">Agent-Native Visual Agent Builder</span>
          </motion.div>

          {/* Main heading */}
          <div className="mb-12">
            <motion.h1
              initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-[64px] md:text-[82px] lg:text-[92px] xl:text-[104px] font-medium leading-[0.9] tracking-[-0.04em] text-fl-ink mb-4"
            >
              <ContainerTextFlipHeading /> Should
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="text-[64px] md:text-[82px] lg:text-[92px] xl:text-[104px] font-medium leading-[0.9] tracking-[-0.04em] text-fl-ink"
            >
              be <span className="italic font-normal">Autonomous</span>.
            </motion.h1>
          </div>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease }}
            className="text-[18px] md:text-[20px] text-fl-ink-2 max-w-[540px] font-medium leading-normal mb-12"
          >
            Onhandl is the sovereign layer for financial intent.
            Prompt, validate, and deploy agents that secure your assets 24/7.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <a href="/signup" className="h-12 px-8 bg-fl-dark text-fl-ink-inv rounded-full flex items-center justify-center font-bold text-sm hover:opacity-90 transition-all shadow-2xl shadow-fl-dark/10">
              Link Your Strategy
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
            <a
              href="/dashboard"
              className="h-12 px-8 border border-fl-line-strong text-fl-ink rounded-full flex items-center justify-center font-bold text-sm hover:bg-fl-surface-2 transition-all"
            >
              Enter Dashboard
            </a>
          </motion.div>

          {/* trusted by */}
          <div className="mt-20 flex flex-wrap items-center gap-x-12 gap-y-6">
            <p className="label-factory !mb-0 opacity-40">Network Native</p>
            <div className="flex flex-wrap items-center gap-8">
              {['CKB', 'BTC', 'ETH', 'SOL'].map((name) => (
                <span key={name} className="text-[15px] font-black tracking-tight text-fl-line-strong grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Lottie Animation Side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="flex-1 w-full max-w-[600px] aspect-square flex items-center justify-center pointer-events-none"
        >
          <LottieAnimation />
        </motion.div>
      </div>
    </section>
  );
};
