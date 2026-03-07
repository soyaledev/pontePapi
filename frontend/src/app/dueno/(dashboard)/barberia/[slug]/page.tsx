import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toTitleCase, isLink } from '@/lib/format';
import { checkBarbershopVisibility } from '@/lib/barbershop-visibility';
import { ServiciosSection } from './ServiciosSection';
import { HorariosSection } from './HorariosSection';
import { TurnosHistorialSection } from './TurnosHistorialSection';
import { SenaConfigCollapsible } from './SenaConfigCollapsible';
import { VisibilityNotice } from './VisibilityNotice';
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

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, photo_url')
    .eq('barbershop_id', barbershop.id)
    .order('order', { ascending: true });

  const { data: historialAppointments } = await supabase
    .from('appointments')
    .select('id, fecha, slot_time, cliente_nombre, cliente_telefono, estado, updated_at')
    .eq('barbershop_id', barbershop.id)
    .in('estado', ['completed', 'cancelled'])
    .order('updated_at', { ascending: false, nullsFirst: false });

  const visibility = checkBarbershopVisibility({
    schedulesCount: (schedules ?? []).length,
    servicesCount: (services ?? []).length,
    requiereSena: !!barbershop.requiere_sena,
    mpLinked: !!barbershop.mp_access_token,
  });

  return (
    <div className={styles.page}>
      <Link href="/dueno/turnos" className={styles.back}>
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
          {barbers && barbers.length > 0 && (
            <div className={styles.infoRow}>
              <dt>Barberos</dt>
              <dd>
                <div className={styles.barberList}>
                  {barbers.map((b) => (
                    <div key={b.id} className={styles.barberItem}>
                      {b.photo_url ? (
                        <img src={b.photo_url} alt={toTitleCase(b.name)} className={styles.barberAvatar} loading="lazy" />
                      ) : (
                        <div className={styles.barberAvatarPlaceholder}>{toTitleCase(b.name).charAt(0)}</div>
                      )}
                      <span>{toTitleCase(b.name)}</span>
                    </div>
                  ))}
                </div>
              </dd>
            </div>
          )}
          {barbershop.city && (
            <div className={styles.infoRow}>
              <dt>Ciudad</dt>
              <dd>{toTitleCase(barbershop.city)}</dd>
            </div>
          )}
          {barbershop.address && (
            <div className={styles.infoRow}>
              <dt>Ubicación</dt>
              <dd>
                {isLink(barbershop.address) ? (
                  <a href={barbershop.address} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                    Ver en Google Maps
                  </a>
                ) : (
                  toTitleCase(barbershop.address)
                )}
              </dd>
            </div>
          )}
          {barbershop.phone && (
            <div className={styles.infoRow}>
              <dt>Teléfono</dt>
              <dd>{barbershop.phone.replace(/\D/g, '').slice(0, 10)}</dd>
            </div>
          )}
        </dl>
      </div>
      <SenaConfigCollapsible
        barbershopId={barbershop.id}
        initialRequiereSena={!!barbershop.requiere_sena}
        initialSenaOpcional={!!barbershop.sena_opcional}
        initialMontoSena={barbershop.monto_sena ?? 0}
        initialComisionCliente={!!barbershop.sena_comision_cliente}
        initialMpLinked={!!barbershop.mp_access_token}
      />
      <ServiciosSection barbershopId={barbershop.id} services={services ?? []} />
      <HorariosSection barbershopId={barbershop.id} schedules={schedules ?? []} />
      <TurnosHistorialSection appointments={historialAppointments ?? []} />
      <VisibilityNotice
        barbershopId={barbershop.id}
        initialVisibility={visibility}
        requiereSena={!!barbershop.requiere_sena}
      />
    </div>
  );
}
