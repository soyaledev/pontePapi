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
const LOAD_MORE_COUNT = 10;

export function TurnosHistorialSection({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  if (appointments.length === 0) {
    return null;
  }

  const displayed = appointments.slice(0, visibleCount);
  const hasMore = appointments.length > visibleCount;
  const remaining = appointments.length - visibleCount;

  function handleVerMas() {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, appointments.length));
  }

  function handleVerMenos() {
    setVisibleCount(INITIAL_COUNT);
  }

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
      {hasMore ? (
        <button
          type="button"
          className={styles.verMas}
          onClick={handleVerMas}
        >
          Ver más (+{Math.min(remaining, LOAD_MORE_COUNT)})
        </button>
      ) : visibleCount > INITIAL_COUNT ? (
        <button
          type="button"
          className={styles.verMas}
          onClick={handleVerMenos}
        >
          Ver menos
        </button>
      ) : null}
    </section>
  );
}
