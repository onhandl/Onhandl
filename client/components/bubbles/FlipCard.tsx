'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
    front: React.ReactNode;
    back: React.ReactNode;
    label?: string;
    className?: string;
}

export function FlipCard({ front, back, label = 'Visualize', className }: FlipCardProps) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className={cn('relative', className)}>
            {/* Toggle button */}
            <button
                onClick={() => setFlipped(f => !f)}
                className={cn(
                    'absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full transition-all cursor-pointer',
                    flipped
                        ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                        : 'bg-muted/60 text-muted-foreground border-border/40 hover:bg-accent/40 hover:text-foreground'
                )}
            >
                <FlipHorizontal className="w-3 h-3" />
                {flipped ? 'Feed' : label}
            </button>

            {/* Flip container */}
            <div className="relative w-full h-full" style={{ perspective: '1200px' }}>
                <motion.div
                    className="relative w-full h-full"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Front */}
                    <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                        {front}
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {back}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
