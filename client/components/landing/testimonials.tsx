import React from 'react';
import { Testimonial } from './types';

interface TestimonialsProps {
    testimonials: Testimonial[];
    currentTestimonial: number;
    setCurrentTestimonial: (index: number) => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({
    testimonials,
    currentTestimonial,
    setCurrentTestimonial,
}) => {
    return (
        <section id="testimonials" className="py-20 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up">
                        What Our Users Say
                    </h2>
                    <p
                        className="text-muted-foreground max-w-2xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Don't just take our word for it. See how AI Builder is transforming businesses across
                        industries.
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="relative mx-auto max-w-4xl" data-aos="fade-up" data-aos-delay="200">
                    <div className="testimonial-container overflow-hidden">
                        <div
                            className="testimonial-track flex transition-transform duration-500"
                            style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="testimonial-item w-full flex-shrink-0">
                                    <div className="bg-gray-50 dark:bg-foreground/50 rounded-xl p-8 shadow-lg dark:shadow-neon">
                                        <div className="flex items-center mb-4">
                                            <div className="flex text-yellow-400">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <blockquote className="text-black-600 dark:text-black-300 mb-6 italic">
                                            "{testimonial.quote}"
                                        </blockquote>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-primary font-bold">
                                                    {testimonial.author.initials}
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold">{testimonial.author.name}</h5>
                                                <p className="text-sm text-muted-foreground">
                                                    {testimonial.author.role}, {testimonial.author.company}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation arrows */}
                    <button
                        className="absolute top-1/2 -left-4 md:-left-8 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-foreground shadow-md flex items-center justify-center focus:outline-none"
                        onClick={() =>
                            setCurrentTestimonial(
                                currentTestimonial > 0 ? currentTestimonial - 1 : testimonials.length - 1
                            )
                        }
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="absolute top-1/2 -right-4 md:-right-8 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-foreground shadow-md flex items-center justify-center focus:outline-none"
                        onClick={() =>
                            setCurrentTestimonial(
                                currentTestimonial < testimonials.length - 1 ? currentTestimonial + 1 : 0
                            )
                        }
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Dots */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`w-3 h-3 rounded-full transition-colors duration-300 ${currentTestimonial === index ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                onClick={() => setCurrentTestimonial(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
