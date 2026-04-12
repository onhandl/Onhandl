'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';

import { scrollToAnchorSelector } from '@/lib/landing/scroll-to-anchor';

/**
 * Smooth in-page navigation; closes the mobile menu when an anchor target is found.
 */
export function useLandingAnchorNavigation(
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>,
): {
  handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
} {
  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();
      if (scrollToAnchorSelector(targetId)) {
        setIsMobileMenuOpen(false);
      }
    },
    [setIsMobileMenuOpen],
  );

  return { handleAnchorClick };
}
