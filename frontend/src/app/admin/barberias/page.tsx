import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkBarbershopVisibility } from '@/lib/barbershop-visibility';
import { toTitleCase } from '@/lib/format';
import styles from '../AdminLayout.module.css';

export default async function AdminBarberiasPage() {
  const admin = getSupabaseAdmin();

  const [{ data: barbershops }, { data: schedules }, { data: services }, { data: usersData }] = await Promise.all([
    admin.from('barbershops').select('*'),
    admin.from('schedules').select('barbershop_id'),
    admin.from('services').select('barbershop_id'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const users = usersData?.users ?? [];

  const scheduleCountByShop: Record<string, number> = {};
  for (const s of schedules ?? []) {
    scheduleCountByShop[s.barbershop_id] = (scheduleCountByShop[s.barbershop_id] ?? 0) + 1;
  }
  const serviceCountByShop: Record<string, number> = {};
  for (const s of services ?? []) {
    serviceCountByShop[s.barbershop_id] = (serviceCountByShop[s.barbershop_id] ?? 0) + 1;
  }

  const userById: Record<string, string> = {};
  for (const u of users) {
    userById[u.id] = u.email ?? '';
  }

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Barberías</h1>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Dueño</th>
              <th>Estado</th>
              <th>MP</th>
              <th>Seña</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(barbershops ?? []).map((b) => {
              const v = checkBarbershopVisibility({
                schedulesCount: scheduleCountByShop[b.id] ?? 0,
                servicesCount: serviceCountByShop[b.id] ?? 0,
                requiereSena: !!b.requiere_sena,
                mpLinked: !!b.mp_access_token,
              });
              const ownerEmail = userById[b.owner_id] ?? '-';
              return (
                <tr key={b.id}>
                  <td>
                    <strong>{toTitleCase(b.name)}</strong>
                    <span className={styles.slug}>/{b.slug}</span>
                  </td>
                  <td>{b.city ? toTitleCase(b.city) : '-'}</td>
                  <td className={styles.emailCell}>{ownerEmail}</td>
                  <td>
                    <span className={v.isVisible ? styles.badgeOk : styles.badgeWarn}>
                      {v.isVisible ? 'Visible' : 'No visible'}
                    </span>
                  </td>
                  <td>{b.mp_access_token ? 'Vinculado' : '-'}</td>
                  <td>{b.requiere_sena ? `Sí ($${b.monto_sena ?? 0})` : 'No'}</td>
                  <td>
                    <Link href={`/barberia/${b.slug}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(!barbershops || barbershops.length === 0) && (
        <p className={styles.empty}>No hay barberías.</p>
      )}
    </div>
  );
}
