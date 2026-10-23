import type { Metadata, Viewport } from 'next';
import '@/index.css';
import { ViewportUnzoom } from '@/components/shared/viewport-unzoom';
import { PwaRegister } from '@/components/shared/pwa-register';

export const metadata: Metadata = {
  title: 'Ledger',
  description: 'The smart group expense ledger for splitting bills, tracking sponsors, and settling balances.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ledger',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-foreground/20">
        <ViewportUnzoom />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
