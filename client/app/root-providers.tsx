'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { UXModeProvider } from '@/contexts/UXModeContext';

export function RootProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <UXModeProvider>
                <WorkspaceProvider>
                    {children}
                </WorkspaceProvider>
            </UXModeProvider>
        </QueryClientProvider>
    );
}
