'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hace scroll al inicio de la página cuando cambia la ruta.
 * Evita que las páginas se abran con scroll hacia abajo.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
