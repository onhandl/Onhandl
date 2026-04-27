import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Figtree, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';


const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Onhandl',
  description: 'Build AI Agents Without Code',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { RootProviders } from './root-providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${figtree.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <RootProviders>
          {children}
        </RootProviders>
        <Toaster />
      </body>
    </html>
  );
}
