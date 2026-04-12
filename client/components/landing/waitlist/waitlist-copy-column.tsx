'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Users } from 'lucide-react';

import { WAITLIST_BENEFITS, WAITLIST_TOTAL_SPOTS } from '@/components/landing/constants';
import { landingEase } from '@/components/landing/motion-ease';

interface WaitlistCopyColumnProps {
  displayCount: string;
  filledPct: number;
}

export function WaitlistCopyColumn({ displayCount, filledPct }: WaitlistCopyColumnProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: landingEase }}
    >
      <p className="label-factory mb-4">Early Access</p>
      <h2 className="text-[40px] md:text-[52px] font-normal tracking-factory-h2 leading-none text-fl-ink-inv mb-6">
        Ready to build the software of the future?
      </h2>
      <p className="text-[15px] text-fl-ink-3 leading-relaxed mb-10">
        Be among the first to experience the future of AI agent building. Beta launches soon — spots are limited.
      </p>

      <ul className="space-y-3 mb-10">
        {WAITLIST_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3 text-[13px] text-fl-ink-inv/80">
            <Check className="w-3.5 h-3.5 text-fl-accent shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      <div className="border border-fl-line-dark rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-fl-accent" />
          <span className="text-[13px] text-fl-ink-inv/80">
            {displayCount} of {WAITLIST_TOTAL_SPOTS.toLocaleString()} spots filled
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-fl-line-dark overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${filledPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduce ? 0 : 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full bg-fl-accent"
          />
        </div>
      </div>
    </motion.div>
  );
}
