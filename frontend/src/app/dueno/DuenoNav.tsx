'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DuenoLayout.module.css';

export function DuenoNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const isTurnos = pathname === '/dueno/turnos';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarLetter = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const isOnClientView = pathname === '/' || pathname.startsWith('/barberia') || pathname.startsWith('/reservar');

  return (
    <nav className={styles.bottomNav}>
      <Link
        href="/dueno/turnos"
        className={`${styles.navItem} ${styles.navItemTurnos} ${isTurnos ? styles.navItemTurnosActive : ''}`}
      >
        Turnos
      </Link>
      <Link
        href="/dueno/dashboard"
        className={`${styles.navItem} ${pathname === '/dueno/dashboard' ? styles.navItemActive : ''}`}
      >
        Panel
      </Link>
      <div className={styles.avatarWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú de cuenta"
          aria-expanded={menuOpen}
        >
          <span className={styles.avatarLetter}>{avatarLetter}</span>
        </button>
        {menuOpen && (
          <div className={styles.avatarMenu}>
            {userEmail && (
              <p className={styles.avatarEmail}>{userEmail}</p>
            )}
            {isOnClientView ? (
              <Link
                href="/dueno/turnos"
                className={styles.avatarMenuItem}
                onClick={() => setMenuOpen(false)}
              >
                Mi panel
              </Link>
            ) : (
              <Link
                href="/"
                className={styles.avatarMenuItem}
                onClick={() => setMenuOpen(false)}
              >
                Ir a menú cliente
              </Link>
            )}
            <form action="/dueno/logout" method="post" className={styles.avatarMenuForm}>
              <button type="submit" className={styles.avatarMenuItem}>
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
