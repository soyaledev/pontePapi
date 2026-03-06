import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkBarbershopVisibility } from '@/lib/barbershop-visibility';
import { formatPeso } from '@/lib/format';
import styles from './AdminLayout.module.css';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default async function AdminOverviewPage() {
  const admin = getSupabaseAdmin();

  const [
    { data: { users } },
    { data: barbershops },
    { data: schedules },
    { data: services },
    { data: appointments },
    { data: paymentsRaw },
    { data: errorLogs },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('barbershops').select('id, owner_id, name, slug, requiere_sena, mp_access_token, monto_sena'),
    admin.from('schedules').select('barbershop_id'),
    admin.from('services').select('barbershop_id'),
    admin.from('appointments').select('id, fecha, estado'),
    admin.from('appointments').select('id, barbershop_id, mp_payment_id').not('mp_payment_id', 'is', null),
    admin.from('error_logs').select('id, created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const userCount = users?.length ?? 0;
  const barbershopList = barbershops ?? [];
  const scheduleCountByShop: Record<string, number> = {};
  for (const s of schedules ?? []) {
    scheduleCountByShop[s.barbershop_id] = (scheduleCountByShop[s.barbershop_id] ?? 0) + 1;
  }
  const serviceCountByShop: Record<string, number> = {};
  for (const s of services ?? []) {
    serviceCountByShop[s.barbershop_id] = (serviceCountByShop[s.barbershop_id] ?? 0) + 1;
  }

  let visibleCount = 0;
  for (const b of barbershopList) {
    const v = checkBarbershopVisibility({
      schedulesCount: scheduleCountByShop[b.id] ?? 0,
      servicesCount: serviceCountByShop[b.id] ?? 0,
      requiereSena: !!b.requiere_sena,
      mpLinked: !!b.mp_access_token,
    });
    if (v.isVisible) visibleCount++;
  }

  const today = todayStr();
  const weekStartStr = weekStart();
  const monthStartStr = monthStart();

  const appointmentsList = appointments ?? [];
  const turnosHoy = appointmentsList.filter((a) => a.fecha === today).length;
  const turnosSemana = appointmentsList.filter((a) => a.fecha >= weekStartStr).length;
  const turnosMes = appointmentsList.filter((a) => a.fecha >= monthStartStr).length;

  const barbershopById: Record<string, { monto_sena: number | null }> = {};
  for (const b of barbershopList) {
    barbershopById[b.id] = { monto_sena: (b as { monto_sena?: number }).monto_sena ?? null };
  }

  let totalSenas = 0;
  let countSenas = paymentsRaw?.length ?? 0;
  for (const p of paymentsRaw ?? []) {
    const monto = barbershopById[p.barbershop_id]?.monto_sena ?? 0;
    totalSenas += monto;
  }

  const errores24h = errorLogs?.length ?? 0;

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.cardGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Usuarios registrados</span>
          <span className={styles.metricValue}>{userCount}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Barberías</span>
          <span className={styles.metricValue}>
            {visibleCount} / {barbershopList.length} visibles
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Turnos hoy</span>
          <span className={styles.metricValue}>{turnosHoy}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Turnos esta semana</span>
          <span className={styles.metricValue}>{turnosSemana}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Turnos este mes</span>
          <span className={styles.metricValue}>{turnosMes}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Señas cobradas</span>
          <span className={styles.metricValue}>
            {formatPeso(totalSenas)} ({countSenas})
          </span>
        </div>
        <Link href="/admin/errores" className={styles.metricCard}>
          <span className={styles.metricLabel}>Errores últimas 24h</span>
          <span className={`${styles.metricValue} ${errores24h > 0 ? styles.metricValueAlert : ''}`}>
            {errores24h}
          </span>
        </Link>
      </div>

      <div className={styles.quickLinks}>
        <Link href="/admin/usuarios" className={styles.quickLink}>
          Ver usuarios →
        </Link>
        <Link href="/admin/barberias" className={styles.quickLink}>
          Ver barberías →
        </Link>
        <Link href="/admin/pagos" className={styles.quickLink}>
          Ver pagos →
        </Link>
        <Link href="/admin/errores" className={styles.quickLink}>
          Ver errores →
        </Link>
      </div>
    </div>
  );
}
