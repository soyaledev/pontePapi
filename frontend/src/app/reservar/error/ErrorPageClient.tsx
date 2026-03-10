'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './Error.module.css';

export function ErrorPageClient({ appointmentId, slug, searchParams }: { appointmentId?: string; slug?: string; searchParams?: Record<string, string> }) {
  useEffect(() => {
    // #region agent log
    if (searchParams && Object.keys(searchParams).length > 0) {
      fetch('http://127.0.0.1:7939/ingest/ce6f701b-fd9f-484e-a36c-bf6777e06b66',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'871633'},body:JSON.stringify({sessionId:'871633',location:'ErrorPageClient.tsx:landed',message:'Usuario llegó a página error (MP redirect failure)',data:{appointmentId,slug,searchParams},hypothesisId:'H4,H5',timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
  }, [searchParams, appointmentId, slug]);
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
        <div className={styles.links}>
          {slug && (
            <Link href={`/reservar/${slug}`} className={styles.link}>
              Reservar de nuevo
            </Link>
          )}
          <Link href="/" className={styles.link}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
