'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';

const STORAGE_KEY = 'admin-sidebar-collapsed';
const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

type NavItem = { href: string; label: string; badge?: number };

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminLayoutClient({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--admin-sidebar-width', `${sidebarWidth}px`);
    return () => document.documentElement.style.removeProperty('--admin-sidebar-width');
  }, [sidebarWidth]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <div
      className={styles.layout}
      style={{ '--admin-sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo}>
            <Image
              src="/images/logosvgPontePapi.svg"
              alt="PontePapi Admin"
              width={120}
              height={36}
            />
          </Link>
          <button
            type="button"
            onClick={toggle}
            className={styles.sidebarToggle}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </button>
        </div>
        {!collapsed && <p className={styles.adminLabel}>Admin</p>}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navItemLabel}>{item.label}</span>
                {!collapsed && item.badge != null && item.badge > 0 && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className={styles.footer}>
          {!collapsed && (
            <form action="/dueno/logout" method="post">
              <button type="submit" className={styles.logoutBtn}>
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
