'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './DuenoLayout.module.css';

function RefreshIcon({ exiting, onExitEnd }: { exiting?: boolean; onExitEnd?: () => void }) {
  return (
    <span
      className={`${styles.refreshIconWrap} ${exiting ? styles.refreshIconExiting : ''}`}
      onAnimationEnd={exiting ? onExitEnd : undefined}
    >
      <svg
        className={styles.refreshIcon}
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12a9 9 0 1 1-2.636-6.364M21 3v6h-6" />
      </svg>
    </span>
  );
}

export function DuenoNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isTurnosPath = pathname === '/dueno/turnos';
  const [isTurnos, setIsTurnos] = useState(isTurnosPath);
  const [isExiting, setIsExiting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (isTurnosPath && !prevPathRef.current.startsWith('/dueno/turnos')) {
      setIsTurnos(true);
      setIsExiting(false);
    } else if (!isTurnosPath && prevPathRef.current === '/dueno/turnos') {
      setIsExiting(true);
    }
    prevPathRef.current = pathname;
  }, [pathname, isTurnosPath]);

  const handleExitEnd = () => {
    if (!isTurnosPath) {
      setIsTurnos(false);
      setIsExiting(false);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

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
      {isTurnos || isExiting ? (
        <button
          type="button"
          className={`${styles.navItem} ${styles.navItemTurnos} ${styles.navItemTurnosActive} ${styles.navItemTurnosRefresh}`}
          onClick={handleRefresh}
          aria-label="Actualizar turnos"
        >
          <span>Turnos</span>
          <RefreshIcon exiting={isExiting} onExitEnd={handleExitEnd} />
        </button>
      ) : (
        <Link
          href="/dueno/turnos"
          className={`${styles.navItem} ${styles.navItemTurnos}`}
        >
          Turnos
        </Link>
      )}
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
            <Link
              href="/dueno/configuracion"
              className={styles.avatarMenuItem}
              onClick={() => setMenuOpen(false)}
            >
              Configuración
            </Link>
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
