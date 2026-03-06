'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatPeso, toTitleCase } from '@/lib/format';
import styles from './Confirmado.module.css';

const LOADING_PHRASES = [
  'Estamos creando tu comprobante…',
  'Te enviamos el comprobante a tu correo',
  'Gracias por confiar en nosotros',
  'Tu turno está confirmado',
  'Guardá tu comprobante para el día del turno',
  'Te esperamos en la barbería',
];

type ComprobanteData = {
  id: string;
  fecha: string;
  hora: string;
  cliente: { nombre: string; telefono: string; email: string | null };
  estado: string;
  mp_payment_id: string | null;
  monto_sena_pagado: number | null;
  monto_sena_neto: number | null;
  created_at: string | null;
  barbershop: { name: string; slug: string; address?: string; city?: string; phone?: string; monto_sena?: number; requiere_sena?: boolean; sena_comision_cliente?: boolean } | null;
  service: { name: string; price: number } | null;
  barber: { name: string } | null;
};

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

  const isPaid = data.estado === 'confirmed';
  const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;
  const montoSenaConfig = data.barbershop?.monto_sena ?? 0;
  const comisionCliente = !!data.barbershop?.sena_comision_cliente;
  const MP_PERCENT = 10.61;
  const MP_FEE = 1 - MP_PERCENT / 100;
  const senaClientePago = data.monto_sena_pagado != null && data.monto_sena_pagado > 0
    ? data.monto_sena_pagado
    : comisionCliente && montoSenaConfig > 0
      ? Math.ceil((montoSenaConfig / MP_FEE) / 50) * 50
      : montoSenaConfig;
  const montoNetoBarbero = data.monto_sena_neto ?? (
    data.monto_sena_pagado != null && data.monto_sena_pagado > 0
      ? (comisionCliente ? montoSenaConfig : Math.round(data.monto_sena_pagado * MP_FEE))
      : montoSenaConfig
  );
  const restanteEnLocal = data.service ? data.service.price - montoNetoBarbero : 0;
  const esperandoPago = tieneSena && !isPaid && data.estado === 'pending_payment';

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

  const fechaFormateada = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const horaCorta = data.hora.slice(0, 5);

  return (
    <div className={styles.page}>
      {emailFailed && (
        <div className={styles.emailFailedBanner} role="alert">
          Tu turno está confirmado, pero no pudimos enviar el comprobante por email. Guardá o sacale captura a los datos que ves acá.
        </div>
      )}
      <div className={styles.comprobante}>
        <Link href="/" className={styles.comprobanteLogo}>
          <img src="/images/logosvgPontePapi.svg" alt="PontePapi" />
        </Link>
        <h1 className={styles.comprobanteTitle}>Comprobante de reserva</h1>
        <p className={styles.comprobanteSubtitle}>
          {emailFailed
            ? 'Guardalo o sacale captura para tener los datos a mano.'
            : 'Guardalo o sacale captura. También te lo enviamos por correo.'}
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
              <dd>
                {data.service
                  ? `${data.service.name}${data.service.price != null ? ` (${formatPeso(data.service.price)})` : ''}`
                  : 'Servicio eliminado'}
              </dd>
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
            {data.cliente.telefono && (
              <div className={styles.comprobanteRow}>
                <dt>Teléfono</dt>
                <dd>{data.cliente.telefono}</dd>
              </div>
            )}
            {data.cliente.email && (
              <div className={styles.comprobanteRow}>
                <dt>Correo</dt>
                <dd>{data.cliente.email}</dd>
              </div>
            )}
          </dl>
        </div>

        {tieneSena && isPaid && data.mp_payment_id && (
          <div className={styles.comprobanteSection}>
            <h2 className={styles.sectionTitle}>Pago de seña</h2>
            <dl className={styles.comprobanteList}>
              <div className={styles.comprobanteRow}>
                <dt>Seña pagada</dt>
                <dd>{formatPeso(senaClientePago)}</dd>
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
              {restanteEnLocal > 0 && (
                <div className={styles.comprobanteRow}>
                  <dt>Restante a abonar en la barbería</dt>
                  <dd><strong>{formatPeso(restanteEnLocal)}</strong></dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <p className={styles.comprobanteNota}>
          {tieneSena && isPaid && data.mp_payment_id && restanteEnLocal > 0
            ? `Llegá unos minutos antes. Recordá que debés abonar ${formatPeso(restanteEnLocal)} en la barbería.`
            : 'Llegá unos minutos antes. Si tenés que cancelar, comunicate con la barbería.'}
        </p>

        <Link href="/" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
