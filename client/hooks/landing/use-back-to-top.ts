'use client';

import { useCallback, useEffect, useState } from 'react';

export function useBackToTop(thresholdPx = 300): {
  visible: boolean;
  scrollToTop: () => void;
} {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > thresholdPx);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { visible, scrollToTop };
}
