'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Workflow, Rocket, Check } from 'lucide-react';

import { landingEase } from '@/components/landing/motion-ease';

const ease = landingEase;

const steps = [
    {
        number: '01',
        icon: Workflow,
        title: 'Design your agent with drag-and-drop',
        description:
            'Connect triggers, actions, and conditions visually. Our smart connector UI makes even complex logic feel simple.',
        bullets: ['Visual agent builder', 'Pre-built components', 'Smart logic connectors'],
    },
    {
        number: '02',
        icon: Rocket,
        title: 'Test, deploy, and monitor your agent',
        description:
            'Validate in real-time, ship with one click, and watch your agent perform in production with full observability.',
        bullets: ['One-click deployment', 'Real-time monitoring', 'Seamless iteration'],
    },
];

export const HowItWorks: React.FC = () => {
    const shouldReduce = useReducedMotion();

    return (
        <section id="how-it-works" className="py-24 bg-fl-surface">
            <div className="max-w-[1400px] mx-auto px-9">

                {/* Header */}
                <div className="mb-16">
                    <div className="rule-factory mb-8" />
                    <p className="label-factory mb-4">Process</p>
                    <h2 className="text-[40px] md:text-[52px] font-normal tracking-factory-h2 leading-none text-fl-ink">
                        From idea to agent in minutes
                    </h2>
                </div>

                {/* Steps */}
                <div className="flex flex-col">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                                className="group"
                            >
                                <div className="h-px bg-fl-line" />

                                <div className="py-10 grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-8 items-start">
                                    {/* Step number */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[13px] font-normal text-fl-ink-3 tabular-nums">
                                            {step.number}
                                        </span>
                                        <div className="w-8 h-8 border border-fl-line rounded-lg flex items-center justify-center group-hover:border-fl-accent/50 transition-colors">
                                            <Icon className="w-4 h-4 text-fl-ink-2 group-hover:text-fl-accent transition-colors" />
                                        </div>
                                    </div>

                                    {/* Title + bullets */}
                                    <div>
                                        <h3 className="text-[20px] font-normal tracking-[-0.025em] text-fl-ink mb-4 leading-snug">
                                            {step.title}
                                        </h3>
                                        <ul className="space-y-2">
                                            {step.bullets.map((b) => (
                                                <li key={b} className="flex items-center gap-2.5 text-[13px] text-fl-ink-2">
                                                    <Check className="w-3.5 h-3.5 text-fl-accent shrink-0" />
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[14px] text-fl-ink-3 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div className="h-px bg-fl-line" />
                </div>
            </div>
        </section>
    );
};
