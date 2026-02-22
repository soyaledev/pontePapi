'use client';

import { useState, useEffect } from 'react';
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
};

export function ComprobanteReserva({ appointmentId }: { appointmentId: string }) {
  const [data, setData] = useState<ComprobanteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/comprobante`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Error al cargar');
        }
        const json = await res.json();
        setData(json);
        setError('');
        if (json.estado === 'confirmed') setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [appointmentId]);

  useEffect(() => {
    if (!data || data.estado === 'confirmed') return;
    const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;
    if (!tieneSena) return;
    if (pollCount >= 5) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/comprobante`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.estado === 'confirmed') setLoading(false);
        }
      } catch {
        // ignorar
      }
      setPollCount((c) => c + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [data?.estado, data?.barbershop, appointmentId, pollCount]);

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
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Procesando tu pago</h1>
          <p className={styles.mensaje}>
            Tu pago está siendo confirmado. Refrescá esta página en unos segundos para ver tu comprobante.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.refreshBtn}
          >
            Refrescar
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
                <dd>{formatInstagram(data.cliente.instagram)}</dd>
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
