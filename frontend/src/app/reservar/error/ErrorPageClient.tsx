'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './Error.module.css';

export function ErrorPageClient({ appointmentId }: { appointmentId?: string }) {
  useEffect(() => {
    if (appointmentId) {
      fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      }).catch(() => {});
    }
  }, [appointmentId]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Error en el pago</h1>
        <p className={styles.mensaje}>
          No se pudo completar el pago. El turno no se reservó. Intentá de nuevo o contactá a la barbería.
        </p>
        <Link href="/" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
