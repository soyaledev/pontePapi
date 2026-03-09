'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function FooterWrapper() {
  const pathname = usePathname();
  const showFooter =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/dueno') && !pathname.startsWith('/dueno/turnos'));

  if (!showFooter) return null;
  return <Footer />;
}
