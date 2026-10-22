import type { Metadata, Viewport } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Bill Split',
  description: 'The smartest way to split group bills, handle sponsors, and manage late arrivals.',
  icons: {
    icon: '/logo.svg',
  },
};

export const viewport: Viewport = {
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
      <body className="antialiased selection:bg-foreground/20">{children}</body>
    </html>
  );
}
