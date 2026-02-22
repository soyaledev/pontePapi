'use client';

import { useState } from 'react';
import { toTitleCase } from '@/lib/format';
import styles from './TurnosHistorialSection.module.css';

type Appointment = {
  id: string;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  cliente_telefono: string;
  estado: string;
};

const INITIAL_COUNT = 3;

export function TurnosHistorialSection({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (appointments.length === 0) {
    return null;
  }

  const displayed = expanded ? appointments : appointments.slice(0, INITIAL_COUNT);
  const hasMore = appointments.length > INITIAL_COUNT;

  return (
    <section className={styles.section}>
      <h2>Turnos completados y cancelados</h2>
      <ul className={styles.list}>
        {displayed.map((a) => (
          <li key={a.id} className={styles.item}>
            <span className={styles.fecha}>
              {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <span className={styles.time}>{a.slot_time.slice(0, 5)}</span>
            <span className={styles.client}>{toTitleCase(a.cliente_nombre)}</span>
            <span
              className={`${styles.estado} ${
                a.estado === 'completed' ? styles.estadoCompleted : styles.estadoCancelled
              }`}
            >
              {a.estado === 'completed' ? 'Completado' : 'Cancelado'}
            </span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          className={styles.verMas}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Ver menos' : `Ver más (${appointments.length - INITIAL_COUNT} más)`}
        </button>
      )}
    </section>
  );
}
