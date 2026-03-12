import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { PLATFORM_NAME, PLATFORM_DESCRIPTION } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default:  PLATFORM_NAME,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description: PLATFORM_DESCRIPTION,
  keywords:    ['FIFA', 'FUT', 'football game accounts', 'marketplace', 'escrow'],
  openGraph: {
    type:        'website',
    title:       PLATFORM_NAME,
    description: PLATFORM_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
