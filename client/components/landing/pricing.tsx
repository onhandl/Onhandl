import React from 'react';
import { PricingPlan } from './types';

interface PricingProps {
    pricingPlans: PricingPlan[];
    handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ pricingPlans, handleAnchorClick }) => {
    return (
        <section id="pricing" className="py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up">
                        Simple, Transparent Pricing
                    </h2>
                    <p
                        className="text-muted-foreground max-w-2xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Choose the plan that works best for your needs. All plans include core features with
                        no hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {pricingPlans.map((plan, index) => (
                        <div
                            key={index}
                            className="card-flip h-96"
                            data-aos="fade-up"
                            data-aos-delay={200 + index * 100}
                        >
                            <div className="card-inner h-full">
                                <div
                                    className={`card-front ${plan.popular ? 'bg-primary dark:bg-primary' : 'bg-white dark:bg-foreground'} rounded-xl shadow-lg dark:shadow-neon p-8 flex flex-col justify-between h-full relative overflow-hidden`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 right-0 bg-neonblue text-white text-xs px-4 py-1 transform rotate-45 translate-x-8 translate-y-4">
                                            Popular
                                        </div>
                                    )}
                                    <div>
                                        <h3
                                            className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'dark:text-white'}`}
                                        >
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-end mb-4">
                                            <span
                                                className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'dark:text-white'}`}
                                            >
                                                {plan.price}
                                            </span>
                                            {plan.period && (
                                                <span
                                                    className={`${plan.popular ? 'text-white/70' : 'text-black-500 dark:text-black-400'} ml-1`}
                                                >
                                                    {plan.period}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`${plan.popular ? 'text-white/80' : 'text-black-600 dark:text-black-400'} mb-6`}
                                        >
                                            {plan.description}
                                        </p>
                                        <ul className="space-y-3 mb-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className={`h-5 w-5 ${plan.popular ? 'text-white' : 'text-primary'} mt-1 mr-2`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    <span
                                                        className={
                                                            plan.popular ? 'text-white' : 'text-black-700 dark:text-black-300'
                                                        }
                                                    >
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="text-center">
                                        <p
                                            className={`text-sm ${plan.popular ? 'text-white/70' : 'text-black-500 dark:text-black-400'} italic mb-2`}
                                        >
                                            Hover to see more details
                                        </p>
                                    </div>
                                </div>
                                <div className="card-back bg-white dark:bg-foreground rounded-xl shadow-lg dark:shadow-neon p-8 flex flex-col justify-between h-full">
                                    <div>
                                        <h3 className="text-xl font-bold mb-6 dark:text-white">
                                            {plan.name} Plan Includes:
                                        </h3>
                                        <ul className="space-y-3 mb-8">
                                            {plan.detailedFeatures.map((feature, i) => (
                                                <li key={i} className="flex items-start">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 text-primary mt-1 mr-2"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    <span className="text-black-700 dark:text-black-300">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <a
                                        href="#waitlist"
                                        className="block text-center px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full transition-all duration-300 transform hover:scale-105"
                                        onClick={(e) => handleAnchorClick(e, '#waitlist')}
                                    >
                                        {plan.ctaText}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
