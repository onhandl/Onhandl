import type React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from 'next/font/google';
import '@/styles/globals.css';

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
      </body>
    </html>
  );
}
