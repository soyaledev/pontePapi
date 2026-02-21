'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import styles from './Turnos.module.css';

type Appointment = {
  id: string;
  barbershop_id: string;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  cliente_telefono: string;
  estado: string;
};

export function TurnosList({
  appointments: initialAppointments,
  barbershopNames,
}: {
  appointments: Appointment[];
  barbershopNames: Record<string, string>;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);

  async function marcarCompletado(id: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ estado: 'completed' })
      .eq('id', id);
    if (error) return;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = a.fecha;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return <p className={styles.empty}>No hay turnos próximos</p>;
  }

  return (
    <div className={styles.list}>
      {sortedDates.map((fecha) => (
        <div key={fecha} className={styles.dayGroup}>
          <h2 className={styles.date}>
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>
          <ul>
            {grouped[fecha]
              .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
              .map((a) => (
                <li key={a.id} className={styles.item}>
                  <span className={styles.time}>{a.slot_time.slice(0, 5)}</span>
                  <span className={styles.client}>{a.cliente_nombre}</span>
                  <span className={styles.phone}>{a.cliente_telefono}</span>
                  <span className={styles.barberia}>{barbershopNames[a.barbershop_id] ?? '-'}</span>
                  <button
                    type="button"
                    className={styles.completadoBtn}
                    onClick={() => marcarCompletado(a.id)}
                    title="Cliente llegó y se cortó"
                  >
                    Completado
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
