'use client';

import { useLayoutEffect, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hace scroll al inicio de la página cuando cambia la ruta.
 * Evita que las páginas se abran con scroll hacia abajo.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  // Refuerzo: scroll tras el layout (Next.js puede posicionar después del paint)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    const t = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
