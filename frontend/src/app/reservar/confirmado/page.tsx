import Link from 'next/link';
import { ComprobanteReserva } from './ComprobanteReserva';
import styles from './Confirmado.module.css';

export default async function ConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{
    appointmentId?: string;
    barberia?: string;
    fecha?: string;
    hora?: string;
    payment_id?: string;
    collection_id?: string;
    status?: string;
    preference_id?: string;
    collection_status?: string;
  }>;
}) {
  const params = await searchParams;
  const { appointmentId, barberia, fecha, hora, payment_id, collection_id, status, preference_id, collection_status } =
    params;

  const mpPaymentId = payment_id ?? collection_id;

  if (appointmentId) {
    return (
      <ComprobanteReserva
        appointmentId={appointmentId}
        mpPaymentId={mpPaymentId}
        mpStatus={status ?? collection_status}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>¡Turno confirmado!</h1>
        {barberia && <p className={styles.barberia}>{barberia}</p>}
        {fecha && hora && (
          <p className={styles.detalle}>
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            a las {hora.slice(0, 5)}
          </p>
        )}
        <p className={styles.mensaje}>
          Llegá unos minutos antes. Si tenés que cancelar, comunicate con la barbería.
        </p>
        <Link href="/" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
