'use client';

import { useCallback, useEffect, useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/api-public';

export function useWaitlistForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = getPublicApiBaseUrl();
    fetch(`${base}/waitlist/count`)
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(null));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
        const res = await fetch(`${getPublicApiBaseUrl()}/waitlist/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), source: 'landing' }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            res.status === 409
              ? "You're already on the waitlist — we'll be in touch soon!"
              : data.error || 'Something went wrong. Please try again.',
          );
          return;
        }
        if (data.count !== undefined) setCount(data.count);
        setSubmitted(true);
      } catch {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [email, name],
  );

  const clearEmailError = useCallback(() => setError(''), []);

  return {
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
  };
}
