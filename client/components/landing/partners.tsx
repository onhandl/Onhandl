import React from 'react';

export const Partners: React.FC = () => {
    return (
        <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
                <p className="text-center text-black-500 dark:text-black-400 mb-8">
                    Trusted by innovative teams worldwide
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                    {['TechCorp', 'AILabs', 'FutureX', 'NexGen', 'DataFlow'].map((partner) => (
                        <div
                            key={partner}
                            className="w-24 h-12 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <div className="text-xl font-bold text-black-700 dark:text-black-300">{partner}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
