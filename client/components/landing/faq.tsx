import React from 'react';
import { FaqItem } from './types';

interface FaqProps {
    faqItems: FaqItem[];
    openFaqItem: number | null;
    setOpenFaqItem: (index: number | null) => void;
}

export const Faq: React.FC<FaqProps> = ({ faqItems, openFaqItem, setOpenFaqItem }) => {
    return (
        <section id="faq" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up">
                        Frequently Asked Questions
                    </h2>
                    <p
                        className="text-muted-foreground max-w-2xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Find answers to the most common questions about AI Builder and our no-code platform.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {faqItems.map((item, index) => (
                        <div
                            key={index}
                            className="mb-6 bg-gray-50 dark:bg-foreground/50 rounded-xl overflow-hidden shadow-md dark:shadow-neon"
                            data-aos="fade-up"
                            data-aos-delay={200 + index * 100}
                        >
                            <button
                                className="flex justify-between items-center w-full px-6 py-4 text-left focus:outline-none"
                                onClick={() => setOpenFaqItem(openFaqItem === index ? null : index)}
                            >
                                <h3 className="text-lg font-semibold">{item.question}</h3>
                                <svg
                                    className={`w-5 h-5 text-black-500 dark:text-black-400 transition-transform duration-300 ${openFaqItem === index ? 'rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                            <div
                                className={`accordion-content px-6 pb-4 ${openFaqItem === index ? 'open' : ''}`}
                            >
                                <p className="text-muted-foreground">{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
