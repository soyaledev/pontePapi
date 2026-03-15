import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { isEmailVerified } from '@/lib/auth/is-email-verified';
import { DuenoNav } from '../DuenoNav';
import { ThemeAwareLogo } from '@/components/ThemeAwareLogo';
import { WelcomeOverlay } from './WelcomeOverlay/WelcomeOverlay';
import styles from '../DuenoLayout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dueno/login');
  }

  const isAdminUser = await isAdmin(user.email);
  const metadata = user.app_metadata as { provider?: string };
  const emailVerified = await isEmailVerified(user.id, metadata?.provider);

  if (!isAdminUser && !emailVerified) {
    redirect('/dueno/verificar-correo');
  }
  if (isAdminUser) {
    redirect('/admin');
  }

  return (
    <div className={styles.layout}>
      <WelcomeOverlay userId={user.id} userEmail={user.email ?? ''} />
      <header className={styles.header}>
        <ThemeAwareLogo
          href="/dueno/turnos"
          className={styles.logo}
          width={127}
          height={35}
        />
      </header>
      <main className={styles.main}>{children}</main>
      <DuenoNav userEmail={user?.email ?? ''} isAdmin={isAdminUser} />
    </div>
  );
}
