'use client';

import Link from 'next/link';
import { formatPeso, toTitleCase } from '@/lib/format';
import styles from './ComprobanteCard.module.css';

export type ComprobanteData = {
  id: string;
  fecha: string;
  hora: string;
  cliente: { nombre: string; telefono: string; email: string | null };
  estado: string;
  mp_payment_id: string | null;
  monto_sena_pagado: number | null;
  monto_sena_neto: number | null;
  monto_sena_servicio: number | null;
  barbershop: { name: string; slug: string; address?: string; city?: string; phone?: string; monto_sena?: number; requiere_sena?: boolean; sena_comision_cliente?: boolean } | null;
  service: { name: string; price: number } | null;
  barber: { name: string } | null;
};

type Props = {
  data: ComprobanteData;
  showLink?: boolean;
  compact?: boolean;
  subtitle?: string;
};

export function ComprobanteCard({ data, showLink = true, compact = false, subtitle }: Props) {
  const tieneSena = data.barbershop?.requiere_sena && (data.barbershop?.monto_sena ?? 0) > 0;
  const isPaid = data.estado === 'confirmed';
  const montoSenaConfig = data.barbershop?.monto_sena ?? 0;
  const montoSenaServicio = data.monto_sena_servicio ?? montoSenaConfig;
  const senaClientePago = data.monto_sena_pagado != null && data.monto_sena_pagado > 0
    ? data.monto_sena_pagado
    : montoSenaServicio;
  const restanteEnLocal = data.service ? data.service.price - montoSenaServicio : 0;

  const fechaFormateada = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const horaCorta = (data.hora ?? '').slice(0, 5);

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <div className={styles.cardHeader}>
        <Link href="/" className={styles.logo}>
          <img src="/images/logosvgPontePapi.svg" alt="PontePapi" />
        </Link>
        <h1 className={styles.title}>Comprobante de reserva</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.cardBody}>
      <div className={styles.grid}>
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Turno</h2>
          <dl className={styles.list}>
            <div className={styles.row}><dt>Barbería</dt><dd>{data.barbershop?.name ?? '-'}</dd></div>
            <div className={styles.row}>
              <dt>Servicio</dt>
              <dd>
                {data.service
                  ? `${data.service.name} (${formatPeso(data.service.price)})`
                  : 'Servicio eliminado'}
              </dd>
            </div>
            {data.barber && (
              <div className={styles.row}><dt>Barbero</dt><dd>{toTitleCase(data.barber.name)}</dd></div>
            )}
            <div className={styles.row}><dt>Fecha</dt><dd>{fechaFormateada} {horaCorta}</dd></div>
          </dl>
        </div>
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Cliente</h2>
          <dl className={styles.list}>
            <div className={styles.row}><dt>Nombre</dt><dd>{toTitleCase(data.cliente.nombre)}</dd></div>
            {data.cliente.telefono && (
              <div className={styles.row}><dt>Tel</dt><dd>{data.cliente.telefono}</dd></div>
            )}
            {data.cliente.email && (
              <div className={styles.row}><dt>Email</dt><dd>{data.cliente.email}</dd></div>
            )}
          </dl>
        </div>
      </div>

      {tieneSena && isPaid && data.mp_payment_id && (
        <div className={styles.pago}>
          <span>Seña {formatPeso(senaClientePago)}</span>
          {restanteEnLocal > 0 && (
            <span><strong>Restante {formatPeso(restanteEnLocal)}</strong></span>
          )}
          <span className={styles.aprobado}>Aprobado</span>
        </div>
      )}

      <p className={styles.nota}>
        {tieneSena && isPaid && restanteEnLocal > 0
          ? `Abonar ${formatPeso(restanteEnLocal)} en la barbería.`
          : 'Llegá unos minutos antes.'}
      </p>

      {showLink && (
        <Link href="/" className={styles.link}>Volver al inicio</Link>
      )}

      <p className={styles.reservaId}>Nº {data.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}
