import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TurnosList } from './TurnosList';
import styles from './Turnos.module.css';

export const dynamic = 'force-dynamic';

const PAST_DAYS = 7;

export default async function TurnosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dueno/login');

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .single();

  if (!barbershop) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Próximos turnos</h1>
        <p className={styles.empty}>
          No tenés una barbería. <Link href="/dueno/dashboard">Registrarla desde el Panel</Link>.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const pastDate = new Date(Date.now() - PAST_DAYS * 86400000).toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const [{ data: rawAppointments }, { data: rawPastAppointments }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, barbershop_id, barber_id, fecha, slot_time, cliente_nombre, cliente_telefono, cliente_email, estado')
      .eq('barbershop_id', barbershop.id)
      .gte('fecha', today)
      .order('fecha')
      .order('slot_time'),
    supabase
      .from('appointments')
      .select('id, barbershop_id, barber_id, fecha, slot_time, cliente_nombre, cliente_telefono, cliente_email, estado')
      .eq('barbershop_id', barbershop.id)
      .eq('estado', 'confirmed')
      .gte('fecha', pastDate)
      .lt('fecha', today)
      .order('fecha', { ascending: false })
      .order('slot_time'),
  ]);

  const allIds = [
    ...(rawAppointments ?? []),
    ...(rawPastAppointments ?? []),
  ];
  const barberIds = Array.from(new Set(allIds.map((a) => a.barber_id).filter(Boolean)));
  const { data: barbersData } = barberIds.length > 0
    ? await supabase.from('barbers').select('id, name').in('id', barberIds)
    : { data: [] };
  const barberNames = Object.fromEntries((barbersData ?? []).map((b) => [b.id, b.name]));

  const proximos = (rawAppointments ?? []).filter((a) => a.estado === 'confirmed');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Próximos turnos</h1>
      <TurnosList
        appointments={proximos}
        pastAppointments={rawPastAppointments ?? []}
        barberNames={barberNames}
      />
    </div>
  );
}
