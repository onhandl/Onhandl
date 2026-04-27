'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { UXModeProvider } from '@/contexts/UXModeContext';

export function DashboardProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}
