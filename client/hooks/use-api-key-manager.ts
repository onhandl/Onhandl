import { useCallback } from 'react';

/**
 * API keys are now stored server-side via /settings (ApiKeysCard).
 * This hook is kept for backward-compat with flow-builder but is a no-op.
 */
export const useApiKeyManager = () => {
  const handleSaveApiKey = useCallback((_provider: string, _apiKey: string) => {
    // no-op: keys are managed in /settings, not in the sandbox
  }, []);

  return { handleSaveApiKey };
};
