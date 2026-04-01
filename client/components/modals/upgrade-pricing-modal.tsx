'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, Crown, Rocket } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with AI automation.',
    icon: Zap,
    iconColor: 'text-muted-foreground',
    borderColor: 'border-border/60',
    features: [
      'Up to 3 agents',
      'Max 5 nodes per agent',
      '500 tokens / month',
      '50 tokens per node executed',
      'Community support',
      'Basic templates',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$8',
    period: '/month',
    description: 'For individuals building more agents.',
    icon: Sparkles,
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/30',
    features: [
      'Up to 10 agents',
      'Max 20 nodes per agent',
      '5,000 tokens / month',
      '50 tokens per node executed',
      'Email support',
      'All templates',
      'Marketplace publishing',
      'Delete & re-edit agents',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$16',
    period: '/month',
    description: 'For power users with advanced needs.',
    icon: Crown,
    iconColor: 'text-primary',
    borderColor: 'border-primary',
    popular: true,
    features: [
      'Up to 100 agents',
      'Max 50 nodes per agent',
      '25,000 tokens / month',
      '50 tokens per node executed',
      'Priority support',
      'Custom personas',
      'Analytics dashboard',
      'Revenue dashboard',
      'Embed & PWA export',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: '$30',
    period: '/month',
    description: 'No limits — build and deploy freely.',
    icon: Rocket,
    iconColor: 'text-violet-500',
    borderColor: 'border-violet-500/30',
    features: [
      'Unlimited agents',
      'Unlimited nodes per agent',
      '100,000 tokens / month',
      '50 tokens per node executed',
      'Dedicated support',
      'White-label embeds',
      'Revenue dashboard',
      'Custom billing',
      'SLA guarantees',
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export function UpgradePricingModal({ isOpen, onClose, currentPlan = 'free' }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-background border border-border/60 rounded-2xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-background/95 backdrop-blur-sm border-b border-border/40">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Upgrade your plan</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Unlock more agents, nodes, and tokens.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Plan grid */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  const Icon = plan.icon;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${
                        plan.popular
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                          : plan.borderColor + ' bg-card/60'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-md">
                            <Sparkles className="w-2.5 h-2.5" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
                        plan.popular ? 'bg-primary/15' : 'bg-accent/50'
                      }`}>
                        <Icon className={`w-4.5 h-4.5 ${plan.iconColor}`} />
                      </div>

                      <h3 className="font-bold text-base mb-0.5">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{plan.description}</p>

                      <div className="flex items-end gap-1 mb-5">
                        <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                        <span className="text-xs text-muted-foreground mb-1">{plan.period}</span>
                      </div>

                      <ul className="space-y-2 flex-1 mb-5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs">
                            <span className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              plan.popular ? 'bg-primary/20' : 'bg-accent/60'
                            }`}>
                              <Check className={`w-2 h-2 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                            </span>
                            <span className="text-muted-foreground leading-relaxed">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <div className="w-full text-center text-xs font-semibold text-muted-foreground border border-border/40 rounded-xl py-2.5">
                          Current plan
                        </div>
                      ) : (
                        <button
                          className={`w-full text-center text-xs font-semibold rounded-xl py-2.5 transition-all duration-200 ${
                            plan.popular
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                              : 'bg-accent/60 text-foreground hover:bg-accent border border-border/40'
                          }`}
                          onClick={() => {
                            // TODO: wire to Stripe checkout for the selected plan
                            onClose();
                          }}
                        >
                          {plan.id === 'free' ? 'Downgrade' : 'Upgrade to ' + plan.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground pb-5">
                All paid plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
