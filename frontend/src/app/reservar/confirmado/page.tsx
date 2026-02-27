import { redirect } from 'next/navigation';
import { ComprobanteReserva } from './ComprobanteReserva';

export default async function ConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{
    appointmentId?: string;
    payment_id?: string;
    collection_id?: string;
    status?: string;
    collection_status?: string;
    emailFailed?: string;
  }>;
}) {
  const params = await searchParams;
  const { appointmentId, payment_id, collection_id, status, collection_status, emailFailed } = params;
  const mpPaymentId = payment_id ?? collection_id;

  if (!appointmentId) {
    redirect('/');
  }

  return (
    <ComprobanteReserva
      appointmentId={appointmentId}
      mpPaymentId={mpPaymentId}
      mpStatus={status ?? collection_status}
      emailFailed={emailFailed === '1'}
    />
  );
}
