import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ServiciosSection } from './ServiciosSection';
import { HorariosSection } from './HorariosSection';
import { TurnosHistorialSection } from './TurnosHistorialSection';
import { PagosSection } from './PagosSection';
import styles from './BarberiaDetail.module.css';

export default async function BarberiaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!barbershop) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || barbershop.owner_id !== user.id) {
    redirect('/dueno/dashboard');
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name');

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('day_of_week');

  const { data: historialAppointments } = await supabase
    .from('appointments')
    .select('id, fecha, slot_time, cliente_nombre, cliente_telefono, estado')
    .eq('barbershop_id', barbershop.id)
    .in('estado', ['completed', 'cancelled'])
    .order('fecha', { ascending: false })
    .order('slot_time', { ascending: false });

  return (
    <div className={styles.page}>
      <Link href="/dueno/dashboard" className={styles.back}>
        ← Volver
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>{barbershop.name}</h1>
        <Link href={`/dueno/barberia/${slug}/editar`} className={styles.editLink}>
          Editar
        </Link>
      </div>
      {barbershop.photo_url && (
        <img
          src={barbershop.photo_url}
          alt={barbershop.name}
          className={styles.photo}
        />
      )}
      <div className={styles.info}>
        <dl className={styles.infoList}>
          {barbershop.barberos && barbershop.barberos.length > 0 && (
            <div className={styles.infoRow}>
              <dt>Barberos</dt>
              <dd>{barbershop.barberos.join(', ')}</dd>
            </div>
          )}
          {barbershop.city && (
            <div className={styles.infoRow}>
              <dt>Ciudad</dt>
              <dd>{barbershop.city}</dd>
            </div>
          )}
          {barbershop.address && (
            <div className={styles.infoRow}>
              <dt>Dirección</dt>
              <dd>{barbershop.address}</dd>
            </div>
          )}
          {barbershop.phone && (
            <div className={styles.infoRow}>
              <dt>Teléfono</dt>
              <dd>{barbershop.phone}</dd>
            </div>
          )}
          <div className={styles.infoRow}>
            <dt>Seña</dt>
            <dd>{barbershop.requiere_sena ? `$${barbershop.monto_sena}` : 'Sin seña'}</dd>
          </div>
        </dl>
      </div>
      <PagosSection
        barbershopId={barbershop.id}
        requiereSena={!!barbershop.requiere_sena}
        mpLinked={!!barbershop.mp_access_token}
      />
      <ServiciosSection barbershopId={barbershop.id} services={services ?? []} />
      <HorariosSection barbershopId={barbershop.id} schedules={schedules ?? []} />
      <TurnosHistorialSection appointments={historialAppointments ?? []} />
    </div>
  );
}
