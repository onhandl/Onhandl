'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { landingEase } from '@/components/landing/motion-ease';

interface WaitlistFormColumnProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  submitted: boolean;
  isLoading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onClearError: () => void;
}

export function WaitlistFormColumn({
  name,
  setName,
  email,
  setEmail,
  submitted,
  isLoading,
  error,
  onSubmit,
  onClearError,
}: WaitlistFormColumnProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: 0.1, ease: landingEase }}
      className="border border-fl-line-dark rounded-lg p-8 bg-fl-dark-2"
    >
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full border border-fl-accent/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-fl-accent" />
          </div>
          <h3 className="text-[18px] font-normal text-fl-ink-inv mb-2">You&apos;re on the list!</h3>
          <p className="text-[13px] text-fl-ink-3">We&apos;ll notify you the moment your spot is ready.</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="wl-name" className="block text-[11px] uppercase tracking-[0.06em] text-fl-ink-3 mb-2">
              Full Name
            </label>
            <input
              id="wl-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[4px] border border-fl-line-dark bg-fl-dark text-fl-ink-inv placeholder:text-fl-ink-3 focus:outline-none focus:border-fl-accent/60 transition-colors text-[14px]"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="wl-email" className="block text-[11px] uppercase tracking-[0.06em] text-fl-ink-3 mb-2">
              Email Address
            </label>
            <input
              id="wl-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                onClearError();
              }}
              className="w-full px-3 py-2.5 rounded-[4px] border border-fl-line-dark bg-fl-dark text-fl-ink-inv placeholder:text-fl-ink-3 focus:outline-none focus:border-fl-accent/60 transition-colors text-[14px]"
              placeholder="john@example.com"
            />
          </div>
          {error && (
            <p className="text-[13px] text-red-400 border border-red-400/20 rounded-[4px] px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-fl-accent w-full justify-center text-[14px] py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Secure Your Spot
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <p className="text-[11px] text-fl-ink-3 text-center">No spam, unsubscribe at any time.</p>
        </form>
      )}
    </motion.div>
  );
}
