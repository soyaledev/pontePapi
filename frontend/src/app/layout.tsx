import type { Metadata, Viewport } from 'next';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barbert.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'PontePapi',
  description: 'Sacá turno en tu barbería de confianza',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/faviconsvgPontePapi.svg',
  },
  openGraph: {
    title: 'PontePapi',
    description: 'Sacá turno en tu barbería de confianza',
    images: [{ url: '/images/openGraph.jpg', width: 1200, height: 630 }],
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PontePapi',
    description: 'Sacá turno en tu barbería de confianza',
    images: ['/images/openGraph.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#e94560',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
