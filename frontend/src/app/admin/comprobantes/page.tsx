import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { toTitleCase } from '@/lib/format';
import { ComprobantesPreview } from './ComprobantesPreview';
import styles from '../AdminLayout.module.css';

export default async function AdminComprobantesPage() {
  const admin = getSupabaseAdmin();

  const { data: appointments } = await admin
    .from('appointments')
    .select('id, fecha, slot_time, cliente_nombre, barbershop_id, estado')
    .in('estado', ['confirmed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(80);

  const barbershopIds = [...new Set((appointments ?? []).map((a) => a.barbershop_id))];
  const { data: barbershops } = await admin
    .from('barbershops')
    .select('id, name')
    .in('id', barbershopIds);

  const bsById: Record<string, string> = {};
  for (const b of barbershops ?? []) {
    bsById[b.id] = b.name;
  }

  const options = (appointments ?? []).map((a) => ({
    id: a.id,
    label: `${a.fecha} ${a.slot_time?.slice(0, 5) ?? ''} · ${toTitleCase(a.cliente_nombre)} · ${bsById[a.barbershop_id] ?? '-'}`,
  }));

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Comprobantes</h1>
      <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Seleccioná un turno para ver cómo se muestra el comprobante.
      </p>
      <ComprobantesPreview appointments={options} />
    </div>
  );
}
