import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { formatPeso, toTitleCase } from '@/lib/format';
import styles from '../AdminLayout.module.css';

export default async function AdminPagosPage() {
  const admin = getSupabaseAdmin();

  const { data: payments } = await admin
    .from('appointments')
    .select('id, fecha, slot_time, cliente_nombre, barbershop_id, mp_payment_id, created_at')
    .not('mp_payment_id', 'is', null)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const barbershopIds = [...new Set((payments ?? []).map((p) => p.barbershop_id))];
  const { data: barbershops } = await admin
    .from('barbershops')
    .select('id, name, slug, monto_sena')
    .in('id', barbershopIds);

  const barbershopById: Record<string, { name: string; slug: string; monto_sena: number }> = {};
  for (const b of barbershops ?? []) {
    barbershopById[b.id] = {
      name: b.name,
      slug: b.slug,
      monto_sena: b.monto_sena ?? 0,
    };
  }

  const total = (payments ?? []).reduce(
    (sum, p) => sum + (barbershopById[p.barbershop_id]?.monto_sena ?? 0),
    0
  );

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Pagos de seña</h1>

      <div className={styles.summaryRow}>
        <span>Total cobrado: <strong>{formatPeso(total)}</strong></span>
        <span>({payments?.length ?? 0} pagos)</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Barbería</th>
              <th>Monto</th>
              <th>ID MP</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.fecha}</td>
                <td>{p.slot_time?.slice(0, 5) ?? '-'}</td>
                <td>{toTitleCase(p.cliente_nombre)}</td>
                <td>
                  {barbershopById[p.barbershop_id] ? (
                    <Link href={`/barberia/${barbershopById[p.barbershop_id].slug}`} className={styles.link}>
                      {barbershopById[p.barbershop_id].name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{formatPeso(barbershopById[p.barbershop_id]?.monto_sena ?? 0)}</td>
                <td className={styles.mono}>{p.mp_payment_id ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
