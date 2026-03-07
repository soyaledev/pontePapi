import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getUnresolvedErrorCount } from '@/lib/admin';
import { AdminMobileNotice } from './AdminMobileNotice';
import { AdminLayoutClient } from './AdminLayoutClient';

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
    { href: '/admin/comprobantes', label: 'Comprobantes' },
    { href: '/admin/errores', label: 'Errores', badge: unresolvedCount },
    { href: '/admin/aia', label: 'AIA' },
  ];

  return (
    <AdminMobileNotice>
      <AdminLayoutClient navItems={navItems}>{children}</AdminLayoutClient>
    </AdminMobileNotice>
  );
}
