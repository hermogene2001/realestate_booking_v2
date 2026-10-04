import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Providers } from './providers';
import NavbarWrapper from '@/components/layout/NavbarWrapper';
import FooterWrapper from '@/components/layout/FooterWrapper';
import AIChatAssistant from '@/components/AIChatAssistant';

export const metadata: Metadata = {
  title: 'Kigali Real Estate Booking',
  description: 'Decentralized real estate booking platform for Kigali, Rwanda. Secure deposits with blockchain escrow.',
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KigaliRE',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <NavbarWrapper />
          <main className="flex-1">{children}</main>
          <FooterWrapper />
          <AIChatAssistant />
        </Providers>
      </body>
    </html>
  );
}
