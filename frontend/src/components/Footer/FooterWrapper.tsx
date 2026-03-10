'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function FooterWrapper() {
  const pathname = usePathname();
  const showFooter =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/dueno') &&
      !pathname.startsWith('/dueno/turnos') &&
      !pathname.includes('/editar'));

  if (!showFooter) return null;
  const withBottomNav =
    pathname.startsWith('/dueno') && !pathname.startsWith('/dueno/turnos');
  return <Footer withBottomNav={withBottomNav} />;
}
