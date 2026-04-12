/**
 * Public API base URL for client-side fetches (auth, waitlist, etc.).
 */
export function getPublicApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/api`;
}
