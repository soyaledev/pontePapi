'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';
import styles from './FooterWrapper.module.css';

export function FooterWrapper() {
  const pathname = usePathname();
  const showFooter =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/dueno') &&
      !pathname.startsWith('/dueno/turnos') &&
      !pathname.startsWith('/dueno/login') &&
      !pathname.startsWith('/dueno/registro') &&
      !pathname.startsWith('/dueno/verificar-correo') &&
      !pathname.includes('/editar'));

  if (!showFooter) return null;
  const withBottomNav =
    pathname.startsWith('/dueno') && !pathname.startsWith('/dueno/turnos');
  const inSidebarLayout = pathname.startsWith('/admin');

  const footer = <Footer withBottomNav={withBottomNav} />;
  return inSidebarLayout ? (
    <div className={styles.wrapSidebar}>{footer}</div>
  ) : (
    footer
  );
}
