import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ConfiguracionClient } from './ConfiguracionClient';
import styles from './Configuracion.module.css';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dueno/login');

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id, name, slug, mp_access_token')
    .eq('owner_id', user.id);

  const mpLinkedCount = barbershops?.filter((b) => !!b.mp_access_token).length ?? 0;

  return (
    <div className={styles.page}>
      <Link href="/dueno/dashboard" className={styles.back}>
        ← Volver
      </Link>
      <h1 className={styles.title}>Configuración</h1>
      <ConfiguracionClient
        userEmail={user.email ?? ''}
        hasMpLinked={mpLinkedCount > 0}
      />
    </div>
  );
}
