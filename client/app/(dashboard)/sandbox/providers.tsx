'use client';

import { WagmiProvider } from 'wagmi';
import { config } from '@/config/config';
import { WalletProvider } from '@/contexts/wallet-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { queryClient };
