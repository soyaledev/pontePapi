'use client';

import { useState, useLayoutEffect } from 'react';
import styles from './AdminMobileNotice.module.css';

const DESKTOP_MIN_WIDTH = 1024;

export function AdminMobileNotice({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useLayoutEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (isDesktop) return <>{children}</>;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>Panel solo para desktop</h1>
        <p className={styles.message}>
          El panel de administración está optimizado para computadoras y notebooks. Para usarlo, accedé desde un dispositivo con pantalla de al menos 1024px de ancho.
        </p>
        <form action="/dueno/logout" method="post">
          <button type="submit" className={styles.link}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
