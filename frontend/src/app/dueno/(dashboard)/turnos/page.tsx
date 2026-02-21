import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TurnosList } from './TurnosList';
import styles from './Turnos.module.css';

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

  const today = new Date().toISOString().slice(0, 10);
  const { data: rawAppointments } = await supabase
    .from('appointments')
    .select('id, barbershop_id, fecha, slot_time, cliente_nombre, cliente_telefono, estado')
    .in('barbershop_id', barbershopIds)
    .gte('fecha', today)
    .order('fecha')
    .order('slot_time');

  const appointments = (rawAppointments ?? []).filter(
    (a) => a.estado !== 'completed' && a.estado !== 'cancelled'
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Próximos turnos</h1>
      <TurnosList
        appointments={appointments}
        barbershopNames={barbershopNames}
      />
    </div>
  );
}
