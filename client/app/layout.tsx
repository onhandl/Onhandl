import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { FloatingBot } from '@/components/floating-bot';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
});

const fontMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FlawLess',
  description: 'Build AI Agents Without Code',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased`}
      >
        {children}
        <FloatingBot />
      </body>
    </html>
  );
}
