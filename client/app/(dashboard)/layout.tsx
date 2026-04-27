import type React from 'react';
import Sidebar from '@/components/sidebar';
import { DashboardProviders } from './providers';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-12 md:pt-0">{children}</main>
        <FloatingAssistant />
      </div>
    </DashboardProviders>
  );
}
