import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getUnresolvedErrorCount } from '@/lib/admin';
import styles from './AdminLayout.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dueno/login');
  }

  const admin = await isAdmin(user.email ?? '');
  if (!admin) {
    notFound();
  }

  const unresolvedCount = await getUnresolvedErrorCount();

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/barberias', label: 'Barberías' },
    { href: '/admin/pagos', label: 'Pagos' },
    { href: '/admin/errores', label: 'Errores', badge: unresolvedCount },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.logo}>
          <Image
            src="/images/logosvgPontePapi.svg"
            alt="PontePapi Admin"
            width={120}
            height={36}
          />
        </Link>
        <p className={styles.adminLabel}>Admin</p>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navItem}
            >
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className={styles.footer}>
          <form action="/dueno/logout" method="post">
            <button type="submit" className={styles.logoutBtn}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
