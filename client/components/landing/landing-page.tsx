'use client';

import React, { useState } from 'react';

import { useAosInit } from '@/hooks/landing/use-aos-init';
import { useBackToTop } from '@/hooks/landing/use-back-to-top';
import { useLandingAnchorNavigation } from '@/hooks/landing/use-landing-anchor-navigation';

import { BackToTopButton } from '@/components/landing/back-to-top-button';
import { testimonials, pricingPlans, faqItems } from '@/components/landing/constants';
import { Faq } from '@/components/landing/faq';
import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Navigation } from '@/components/landing/navigation';
import { Partners } from '@/components/landing/partners';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { Waitlist } from '@/components/landing/waitlist';

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  useAosInit();
  const { visible: backToTopVisible, scrollToTop } = useBackToTop(300);
  const { handleAnchorClick } = useLandingAnchorNavigation(setIsMobileMenuOpen);

  return (
    <div className="bg-background text-foreground min-h-screen font-sans selection:bg-primary/30">
      <Navigation
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleAnchorClick={handleAnchorClick}
      />

      <main>
        <Hero handleAnchorClick={handleAnchorClick} />
        <Partners />
        <Features />
        <HowItWorks />
        <Testimonials
          testimonials={testimonials}
          currentTestimonial={currentTestimonial}
          setCurrentTestimonial={setCurrentTestimonial}
        />
        <Pricing pricingPlans={pricingPlans} handleAnchorClick={handleAnchorClick} />
        <Faq faqItems={faqItems} openFaqItem={openFaqItem} setOpenFaqItem={setOpenFaqItem} />
        <Waitlist />
      </main>

      <Footer />

      <BackToTopButton visible={backToTopVisible} onClick={scrollToTop} />
    </div>
  );
}
