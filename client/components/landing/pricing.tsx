'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { PricingPlan } from './types';

interface PricingProps {
    pricingPlans: PricingPlan[];
    handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ pricingPlans, handleAnchorClick }) => {
    const shouldReduce = useReducedMotion();

    return (
        <section id="pricing" className="py-28 bg-muted/20 relative overflow-hidden">
            {/* Depth accents */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16 max-w-2xl mx-auto"
                >
                    <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
                        Pricing
                    </p>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                        Simple, transparent plans
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        No hidden fees, no surprises. Scale up as your needs grow.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                    {pricingPlans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: shouldReduce ? 0 : 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={shouldReduce ? {} : { y: -6, transition: { duration: 0.2 } }}
                            className={`relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden cursor-default ${
                                plan.popular
                                    ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/25'
                                    : 'border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-black/5'
                            }`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="flex items-center gap-1.5 px-6 py-2 bg-white/10 border-b border-white/20">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                    <span className="text-xs font-bold tracking-widest uppercase text-white">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="p-7 flex flex-col flex-1">
                                {/* Plan name */}
                                <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : ''}`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-sm mb-6 leading-relaxed ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="flex items-end gap-1 mb-8">
                                    <span className={`text-5xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : ''}`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className={`text-sm mb-2 ${plan.popular ? 'text-white/60' : 'text-muted-foreground'}`}>
                                            {plan.period}
                                        </span>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.detailedFeatures.map((f) => (
                                        <li key={f} className="flex items-start gap-3 text-sm">
                                            <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                <Check className={`w-2.5 h-2.5 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                                            </span>
                                            <span className={plan.popular ? 'text-white/90' : ''}>
                                                {f}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <a
                                    href="#waitlist"
                                    onClick={(e) => handleAnchorClick(e, '#waitlist')}
                                    className={`block text-center px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                                        plan.popular
                                            ? 'bg-white text-primary hover:bg-white/90 shadow-md hover:-translate-y-0.5'
                                            : 'bg-primary/8 text-primary border border-primary/20 hover:bg-primary/12 hover:border-primary/40'
                                    }`}
                                >
                                    {plan.ctaText}
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-center text-sm text-muted-foreground mt-10"
                >
                    All plans include a 14-day free trial. No credit card required.
                </motion.p>
            </div>
        </section>
    );
};
