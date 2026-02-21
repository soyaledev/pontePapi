'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DuenoLayout.module.css';

export function DuenoNav() {
  const pathname = usePathname();
  const isTurnos = pathname === '/dueno/turnos';

  return (
    <nav className={styles.bottomNav}>
      <Link
        href="/dueno/turnos"
        className={`${styles.navItem} ${isTurnos ? styles.navItemActive : ''}`}
      >
        Turnos
      </Link>
      <Link
        href="/dueno/dashboard"
        className={`${styles.navItem} ${pathname === '/dueno/dashboard' ? styles.navItemActive : ''}`}
      >
        Panel
      </Link>
      <form action="/dueno/logout" method="post" className={styles.navItemForm}>
        <button type="submit" className={styles.navItem}>
          Salir
        </button>
      </form>
    </nav>
  );
}
