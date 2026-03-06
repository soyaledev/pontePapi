'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';

type NavItem = {
  href: string;
  label: string;
  badge?: number;
};

export function AdminNav({ unresolvedErrors = 0 }: { unresolvedErrors?: number }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/barberias', label: 'Barberías' },
    { href: '/admin/turnos', label: 'Turnos' },
    { href: '/admin/pagos', label: 'Pagos' },
    { href: '/admin/errores', label: 'Errores', badge: unresolvedErrors },
  ];

  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        {items.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/dueno/turnos" className={styles.backLink}>
        ← Volver al panel
      </Link>
    </nav>
  );
}
