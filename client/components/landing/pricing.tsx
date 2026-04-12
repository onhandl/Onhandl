'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { landingEase } from '@/components/landing/motion-ease';

import { PricingPlan } from './types';

interface PricingProps {
    pricingPlans: PricingPlan[];
    handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const ease = landingEase;

export const Pricing: React.FC<PricingProps> = ({ pricingPlans, handleAnchorClick }) => {
    const shouldReduce = useReducedMotion();

    return (
        <section id="pricing" className="py-24 bg-fl-base">
            <div className="max-w-[1400px] mx-auto px-9">

                {/* Header */}
                <div className="mb-16">
                    <div className="rule-factory mb-8" />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="label-factory mb-4">Pricing</p>
                            <h2 className="text-[40px] md:text-[52px] font-normal tracking-factory-h2 leading-none text-fl-ink">
                                Simple, transparent plans
                            </h2>
                        </div>
                        <p className="text-[15px] text-fl-ink-2 max-w-[360px]">
                            No hidden fees, no surprises. Scale up as your needs grow.
                        </p>
                    </div>
                </div>

                {/* Cards — 1px gap grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-fl-line">
                    {pricingPlans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.08, ease }}
                            className={`flex flex-col p-7 ${
                                plan.popular
                                    ? 'bg-fl-dark text-fl-ink-inv'
                                    : 'bg-fl-surface hover:bg-fl-surface-2 transition-colors'
                            }`}
                        >
                            {/* Plan header */}
                            <div className="mb-6">
                                {plan.popular && (
                                    <span className="inline-block text-[10px] uppercase tracking-[0.08em] text-fl-accent mb-3">
                                        Most Popular
                                    </span>
                                )}
                                <h3 className={`text-[15px] font-normal mb-1 ${plan.popular ? 'text-fl-ink-inv' : 'text-fl-ink'}`}>
                                    {plan.name}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-fl-ink-3">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-7">
                                <span className={`text-[40px] font-normal tracking-factory-h2 ${plan.popular ? 'text-fl-ink-inv' : 'text-fl-ink'}`}>
                                    {plan.price}
                                </span>
                                {plan.period && (
                                    <span className="text-[13px] text-fl-ink-3">{plan.period}</span>
                                )}
                            </div>

                            {/* Divider */}
                            <div className={`h-px mb-7 ${plan.popular ? 'bg-fl-line-dark' : 'bg-fl-line'}`} />

                            {/* Features */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.detailedFeatures.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-fl-accent" />
                                        <span className={plan.popular ? 'text-fl-ink-inv/80' : 'text-fl-ink-2'}>
                                            {f}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <a
                                href="#waitlist"
                                onClick={(e) => handleAnchorClick(e, '#waitlist')}
                                className={`block text-center px-4 py-2.5 text-[13px] rounded-[4px] transition-opacity hover:opacity-85 cursor-pointer ${
                                    plan.popular
                                        ? 'bg-fl-accent text-fl-ink-inv'
                                        : 'bg-fl-dark text-fl-ink-inv'
                                }`}
                            >
                                {plan.ctaText}
                            </a>
                        </motion.div>
                    ))}
                </div>

                <p className="text-center text-[12px] text-fl-ink-3 mt-8">
                    All plans include a 14-day free trial. No credit card required.
                </p>
            </div>
        </section>
    );
};
