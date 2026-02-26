import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './Dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dueno/login');

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .limit(1)
    .single();

  if (!barbershop) {
    return (
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Panel</h1>
        <div className={styles.empty}>
          <p>No tenés una barbería registrada.</p>
          <Link href="/dueno/barberia/nueva" className={styles.link}>
            Registrar barbería
          </Link>
        </div>
      </div>
    );
  }

  redirect(`/dueno/barberia/${barbershop.slug}`);
}
