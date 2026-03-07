'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ComprobanteCard, type ComprobanteData } from '@/components/ComprobanteCard/ComprobanteCard';
import styles from './Confirmado.module.css';

const LOADING_PHRASES = [
  'Estamos creando tu comprobante…',
  'Te enviamos el comprobante a tu correo',
  'Gracias por confiar en nosotros',
  'Tu turno está confirmado',
  'Guardá tu comprobante para el día del turno',
  'Te esperamos en la barbería',
];

export function ComprobanteReserva({
  appointmentId,
  mpPaymentId,
  mpStatus,
  emailFailed,
}: {
  appointmentId: string;
  mpPaymentId?: string;
  mpStatus?: string;
  emailFailed?: boolean;
}) {
  const [data, setData] = useState<ComprobanteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const confirmPaymentIfNeeded = useCallback(async (): Promise<{ conflict?: boolean; expired?: boolean } | null> => {
    if (!mpPaymentId) return null;
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: mpPaymentId }),
      });
      if (res.status === 409) return { conflict: true };
      if (res.status === 410) return { expired: true };
      return null;
    } catch {
      return null;
    }
  }, [appointmentId, mpPaymentId]);

  const fetchComprobante = useCallback(async () => {
    const res = await fetch(`/api/appointments/${appointmentId}/comprobante`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Error al cargar');
    }
    return res.json();
  }, [appointmentId]);

  useEffect(() => {
    if (!loading || data) return;
    const t = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 2800);
    return () => clearInterval(t);
  }, [loading, data]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const confirmResult = await confirmPaymentIfNeeded();
        if (!cancelled && confirmResult?.conflict) {
          setError('Este turno ya fue tomado por otro cliente. El turno fue liberado.');
          setData(null);
          setLoading(false);
          return;
        }
        if (!cancelled && confirmResult?.expired) {
          setError('El tiempo para pagar la seña ha expirado. El turno fue liberado.');
          setData(null);
          setLoading(false);
          return;
        }
        const json = await fetchComprobante();
        if (!cancelled) {
          setData(json);
          setError('');
          if (json.estado === 'confirmed') setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [appointmentId, confirmPaymentIfNeeded, fetchComprobante]);

  useEffect(() => {
    if (!data || data.estado === 'confirmed') return;
    const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;
    if (!tieneSena) return;
    if (pollCount >= 15) return;
    const t = setTimeout(async () => {
      await confirmPaymentIfNeeded();
      try {
        const json = await fetchComprobante();
        setData(json);
        if (json.estado === 'confirmed') setLoading(false);
      } catch {
        // ignorar
      }
      setPollCount((c) => c + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [data?.estado, data?.barbershop, appointmentId, pollCount, confirmPaymentIfNeeded, fetchComprobante]);

  if (loading && !data) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingPhrase} key={phraseIndex}>
          {LOADING_PHRASES[phraseIndex]}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.error}>{error}</p>
          <Link href="/" className={styles.link}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;
  const esperandoPago = tieneSena && data.estado !== 'confirmed' && data.estado === 'pending_payment';

  if (esperandoPago) {
    async function handleRefresh() {
      setRefreshing(true);
      try {
        await confirmPaymentIfNeeded();
        const json = await fetchComprobante();
        setData(json);
        if (json.estado === 'confirmed') setLoading(false);
      } catch {
        window.location.reload();
      } finally {
        setRefreshing(false);
      }
    }

    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Procesando tu pago</h1>
          <p className={styles.mensaje}>
            Tu pago está siendo confirmado. La página se actualiza sola. Si no ves el comprobante, probá refrescar.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className={styles.refreshBtn}
          >
            {refreshing ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {emailFailed && (
        <div className={styles.emailFailedBanner} role="alert">
          Tu turno está confirmado, pero no pudimos enviar el comprobante por email. Guardá o sacale captura a los datos que ves acá.
        </div>
      )}
      <ComprobanteCard
        data={data}
        showLink
        compact
        subtitle={
          emailFailed
            ? 'Guardalo o sacale captura para tener los datos a mano.'
            : 'Guardalo o sacale captura. También te lo enviamos por correo.'
        }
      />
    </div>
  );
}
