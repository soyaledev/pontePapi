import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TurnosList } from './TurnosList';
import styles from './Turnos.module.css';

export const dynamic = 'force-dynamic';

export default async function TurnosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dueno/login');

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id, name')
    .eq('owner_id', user.id);

  const barbershopIds = (barbershops ?? []).map((b) => b.id);
  const barbershopNames = Object.fromEntries((barbershops ?? []).map((b) => [b.id, b.name]));

  if (barbershopIds.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Próximos turnos</h1>
        <p className={styles.empty}>No tenés barberías. Creá una desde el Panel.</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const { data: rawAppointments } = await supabase
    .from('appointments')
    .select('id, barbershop_id, barber_id, fecha, slot_time, cliente_nombre, cliente_telefono, estado')
    .in('barbershop_id', barbershopIds)
    .gte('fecha', today)
    .order('fecha')
    .order('slot_time');

  const barberIds = Array.from(new Set((rawAppointments ?? []).map((a) => a.barber_id).filter(Boolean)));
  const { data: barbersData } = barberIds.length > 0
    ? await supabase.from('barbers').select('id, name').in('id', barberIds)
    : { data: [] };
  const barberNames = Object.fromEntries((barbersData ?? []).map((b) => [b.id, b.name]));

  const appointments = (rawAppointments ?? []).filter(
    (a) => a.estado === 'confirmed'
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Próximos turnos</h1>
      <TurnosList
        appointments={appointments}
        barbershopNames={barbershopNames}
        barberNames={barberNames}
        barbershopIds={barbershopIds}
      />
    </div>
  );
}
