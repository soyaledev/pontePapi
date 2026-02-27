import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { DuenoNav } from '../DuenoNav';
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

  return (
    <div className={styles.layout}>
      <WelcomeOverlay userEmail={user.email ?? ''} />
      <header className={styles.header}>
        <Link href="/dueno/turnos" className={styles.logo}>
          <Image
            src="/images/logosvgPontePapi.svg"
            alt="PontePapi"
            width={140}
            height={40}
          />
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
      <DuenoNav userEmail={user?.email ?? ''} />
    </div>
  );
}
