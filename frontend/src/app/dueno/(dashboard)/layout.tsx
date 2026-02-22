import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DuenoNav } from '../DuenoNav';
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

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/dueno/turnos" className={styles.logo}>
          Turnos Barber
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
      <DuenoNav userEmail={user?.email ?? ''} />
    </div>
  );
}
