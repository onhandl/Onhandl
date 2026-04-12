'use client';

import React, { useMemo } from 'react';

import { useWaitlistForm } from '@/hooks/landing/use-waitlist-form';

import { WAITLIST_TOTAL_SPOTS } from '@/components/landing/constants';
import { WaitlistCopyColumn } from '@/components/landing/waitlist/waitlist-copy-column';
import { WaitlistFormColumn } from '@/components/landing/waitlist/waitlist-form-column';

export function WaitlistSection() {
  const {
    name,
    setName,
    email,
    setEmail,
    submitted,
    isLoading,
    error,
    count,
    handleSubmit,
    clearEmailError,
  } = useWaitlistForm();

  const filledPct = useMemo(
    () => (count !== null ? Math.min((count / WAITLIST_TOTAL_SPOTS) * 100, 100) : 88),
    [count],
  );
  const displayCount = count !== null ? count.toLocaleString() : '5,287';

  return (
    <section id="waitlist" className="bg-fl-dark">
      <div className="h-px bg-fl-line-dark" />

      <div className="max-w-[1400px] mx-auto px-9 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <WaitlistCopyColumn displayCount={displayCount} filledPct={filledPct} />
          <WaitlistFormColumn
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            submitted={submitted}
            isLoading={isLoading}
            error={error}
            onSubmit={handleSubmit}
            onClearError={clearEmailError}
          />
        </div>
      </div>
    </section>
  );
}
