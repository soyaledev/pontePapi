import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './Dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/dueno/login');

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id, name, slug, city, phone')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Mis barberías</h1>
        <Link href="/dueno/barberia/nueva" className={styles.addButton}>
          + Nueva barbería
        </Link>
      </div>
      {!barbershops?.length ? (
        <div className={styles.empty}>
          <p>No tenés barberías registradas.</p>
          <Link href="/dueno/barberia/nueva" className={styles.link}>
            Crear la primera
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {barbershops.map((b) => (
            <li key={b.id} className={styles.item}>
              <Link href={`/dueno/barberia/${b.slug}`} className={styles.itemLink}>
                <span className={styles.itemName}>{b.name}</span>
                {b.city && <span className={styles.itemCity}>{b.city}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
