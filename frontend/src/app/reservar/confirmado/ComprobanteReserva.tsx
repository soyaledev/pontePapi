'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatPeso, toTitleCase, formatInstagram } from '@/lib/format';
import styles from './Confirmado.module.css';

type ComprobanteData = {
  id: string;
  fecha: string;
  hora: string;
  cliente: { nombre: string; telefono: string; instagram: string | null };
  estado: string;
  mp_payment_id: string | null;
  created_at: string | null;
  barbershop: { name: string; slug: string; address?: string; city?: string; phone?: string; monto_sena?: number; requiere_sena?: boolean } | null;
  service: { name: string; price: number } | null;
  barber: { name: string } | null;
};

export function ComprobanteReserva({
  appointmentId,
  mpPaymentId,
  mpStatus,
}: {
  appointmentId: string;
  mpPaymentId?: string;
  mpStatus?: string;
}) {
  const [data, setData] = useState<ComprobanteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const confirmPaymentIfNeeded = useCallback(async () => {
    if (mpPaymentId && (mpStatus === 'approved' || mpStatus === 'authorized')) {
      try {
        await fetch(`/api/appointments/${appointmentId}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: mpPaymentId }),
        });
      } catch {
        // ignorar
      }
    }
  }, [appointmentId, mpPaymentId, mpStatus]);

  const fetchComprobante = useCallback(async () => {
    const res = await fetch(`/api/appointments/${appointmentId}/comprobante`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Error al cargar');
    }
    return res.json();
  }, [appointmentId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await confirmPaymentIfNeeded();
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
        <div className={styles.card}>
          <p className={styles.mensaje}>Cargando comprobante...</p>
        </div>
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

  const isPaid = data.estado === 'confirmed';
  const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;

  if (tieneSena && !isPaid) {
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

  const fechaFormateada = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const horaCorta = data.hora.slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.comprobante}>
        <Link href="/" className={styles.comprobanteLogo}>
          <img src="/images/logosvgPontePapi.svg" alt="PontePapi" />
        </Link>
        <h1 className={styles.comprobanteTitle}>Comprobante de reserva</h1>
        <p className={styles.comprobanteSubtitle}>
          Guardá este comprobante. Sacale una captura de pantalla para usarlo como respaldo de tu turno.
        </p>

        <div className={styles.comprobanteSection}>
          <h2 className={styles.sectionTitle}>Detalle del turno</h2>
          <dl className={styles.comprobanteList}>
            <div className={styles.comprobanteRow}>
              <dt>Barbería</dt>
              <dd>{data.barbershop?.name ?? '-'}</dd>
            </div>
            <div className={styles.comprobanteRow}>
              <dt>Servicio</dt>
              <dd>{data.service?.name ?? '-'} {data.service?.price != null && `(${formatPeso(data.service.price)})`}</dd>
            </div>
            {data.barber && (
              <div className={styles.comprobanteRow}>
                <dt>Barbero</dt>
                <dd>{toTitleCase(data.barber.name)}</dd>
              </div>
            )}
            <div className={styles.comprobanteRow}>
              <dt>Fecha</dt>
              <dd>{fechaFormateada} a las {horaCorta}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.comprobanteSection}>
          <h2 className={styles.sectionTitle}>Tus datos</h2>
          <dl className={styles.comprobanteList}>
            <div className={styles.comprobanteRow}>
              <dt>Nombre</dt>
              <dd>{toTitleCase(data.cliente.nombre)}</dd>
            </div>
            <div className={styles.comprobanteRow}>
              <dt>Teléfono</dt>
              <dd>{data.cliente.telefono}</dd>
            </div>
            {data.cliente.instagram && (
              <div className={styles.comprobanteRow}>
                <dt>Instagram</dt>
                <dd className={styles.instagramLower}>{formatInstagram(data.cliente.instagram)}</dd>
              </div>
            )}
          </dl>
        </div>

        {tieneSena && isPaid && (
          <div className={styles.comprobanteSection}>
            <h2 className={styles.sectionTitle}>Pago de seña</h2>
            <dl className={styles.comprobanteList}>
              <div className={styles.comprobanteRow}>
                <dt>Monto</dt>
                <dd>{formatPeso(data.barbershop?.monto_sena ?? 0)}</dd>
              </div>
              <div className={styles.comprobanteRow}>
                <dt>Estado</dt>
                <dd>Aprobado</dd>
              </div>
              {data.mp_payment_id && (
                <div className={styles.comprobanteRow}>
                  <dt>ID de transacción</dt>
                  <dd className={styles.mono}>{data.mp_payment_id}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <p className={styles.comprobanteNota}>
          Llegá unos minutos antes. Si tenés que cancelar, comunicate con la barbería.
        </p>

        <Link href="/" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
