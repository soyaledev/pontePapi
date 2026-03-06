import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { toTitleCase } from '@/lib/format';
import styles from '../AdminLayout.module.css';

export default async function AdminUsuariosPage() {
  const admin = getSupabaseAdmin();

  const [{ data: usersData }, { data: barbershops }, { data: appointments }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('barbershops').select('id, name, slug, owner_id'),
    admin.from('appointments').select('id, barbershop_id'),
  ]);
  const users = usersData?.users ?? [];

  const barbershopsByOwner: Record<string, { id: string; name: string; slug: string }[]> = {};
  const appointmentCountByOwner: Record<string, number> = {};

  for (const b of barbershops ?? []) {
    if (!barbershopsByOwner[b.owner_id]) barbershopsByOwner[b.owner_id] = [];
    barbershopsByOwner[b.owner_id].push({ id: b.id, name: b.name, slug: b.slug });
  }

  const barbershopIdToOwner: Record<string, string> = {};
  for (const b of barbershops ?? []) {
    barbershopIdToOwner[b.id] = b.owner_id;
  }

  for (const a of appointments ?? []) {
    const ownerId = barbershopIdToOwner[a.barbershop_id];
    if (ownerId) {
      appointmentCountByOwner[ownerId] = (appointmentCountByOwner[ownerId] ?? 0) + 1;
    }
  }

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Usuarios</h1>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Proveedor</th>
              <th>Registro</th>
              <th>Barberías</th>
              <th>Turnos</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const shops = barbershopsByOwner[u.id] ?? [];
              const turnos = appointmentCountByOwner[u.id] ?? 0;
              const provider = (u.app_metadata as { provider?: string })?.provider ?? 'email';
              return (
                <tr key={u.id}>
                  <td>
                    <span className={styles.emailCell}>{u.email ?? '-'}</span>
                  </td>
                  <td>{toTitleCase(provider)}</td>
                  <td>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td>
                    {shops.length === 0 ? (
                      '-'
                    ) : (
                      <div className={styles.shopLinks}>
                        {shops.map((s) => (
                          <Link key={s.id} href={`/barberia/${s.slug}`} target="_blank" rel="noopener noreferrer" className={styles.shopLink}>
                            {toTitleCase(s.name)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{turnos}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(!users || users.length === 0) && (
        <p className={styles.empty}>No hay usuarios registrados.</p>
      )}
    </div>
  );
}
