'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { ContainerTextFlip } from '@/components/ui/overlays/container-text-flip';
import { cn } from '@/lib/utils';

export function ContainerTextFlipHeading() {
  const words = ['Anyone', 'Everyone', 'Anything'];
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className={cn(
        'relative mb-6 max-w-2xl text-left text-4xl leading-normal font-bold tracking-tight text-fl-ink md:text-7xl',
      )}
      layout
    >
      <span className="inline-block">
        <ContainerTextFlip words={words} />
      </span>
    </motion.span>
  );
}
