'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlays/dialog';
import { Check, Sparkles, X } from 'lucide-react';

const PLANS = [
    {
        name: 'Starter',
        price: '$8',
        period: '/mo',
        agents: 10,
        tokens: '5,000',
        features: ['10 agents', 'Delete & re-edit', 'All templates', 'Email support'],
    },
    {
        name: 'Pro',
        price: '$16',
        period: '/mo',
        agents: 100,
        tokens: '25,000',
        features: ['100 agents', 'Priority support', 'Advanced analytics', 'Revenue dashboard'],
        popular: true,
    },
    {
        name: 'Unlimited',
        price: '$30',
        period: '/mo',
        agents: -1,
        tokens: '100,000',
        features: ['Unlimited agents', 'Dedicated support', 'Custom integrations', 'SLA guarantees'],
    },
];

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: string;
}

export function UpgradeModal({ isOpen, onClose, currentPlan = 'free' }: UpgradeModalProps) {
    const handleChoosePlan = (planName: string) => {
        // TODO: wire Stripe checkout per plan when billing is ready
        const slug = planName.toLowerCase();
        window.location.href = `mailto:support@flawless.ai?subject=Upgrade to ${planName} plan`;
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Upgrade your plan
                    </DialogTitle>
                    <DialogDescription>
                        Choose the plan that fits your needs. Upgrade anytime, cancel anytime.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {PLANS.map((plan) => {
                        const isCurrent = currentPlan === plan.name.toLowerCase();
                        return (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                                    plan.popular
                                        ? 'border-primary bg-primary text-white shadow-xl shadow-primary/25'
                                        : 'border-border/60 bg-card/50 hover:border-primary/30'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="flex items-center gap-1 mb-3 text-xs font-bold uppercase tracking-widest text-white/80">
                                        <Sparkles className="w-3 h-3" /> Most Popular
                                    </div>
                                )}

                                <h3 className={`text-base font-bold mb-0.5 ${plan.popular ? 'text-white' : ''}`}>
                                    {plan.name}
                                </h3>

                                <div className="flex items-end gap-1 mb-4">
                                    <span className={`text-3xl font-extrabold ${plan.popular ? 'text-white' : ''}`}>
                                        {plan.price}
                                    </span>
                                    <span className={`text-xs mb-1 ${plan.popular ? 'text-white/60' : 'text-muted-foreground'}`}>
                                        {plan.period}
                                    </span>
                                </div>

                                <ul className="space-y-2 mb-5 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                <Check className={`w-2.5 h-2.5 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                                            </span>
                                            <span className={plan.popular ? 'text-white/90' : ''}>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isCurrent ? (
                                    <div className={`text-center py-2 rounded-xl text-xs font-semibold ${plan.popular ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        Current Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleChoosePlan(plan.name)}
                                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                            plan.popular
                                                ? 'bg-white text-primary hover:bg-white/90'
                                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        }`}
                                    >
                                        Choose {plan.name}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-3">
                    All plans include a 14-day free trial. No credit card required to start.
                </p>
            </DialogContent>
        </Dialog>
    );
}
