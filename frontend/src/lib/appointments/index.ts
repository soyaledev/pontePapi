/**
 * Helpers para appointments.
 * Centraliza lógica de expiración de bloqueos y validación de slots.
 */

import { isPaymentExpired } from '@/lib/payments';

/**
 * Indica si un appointment en pending_payment ha expirado.
 * Los slots expirados no deben bloquear horarios.
 * Expira exactamente 15 minutos después de created_at.
 */
export function isAppointmentExpired(appointment: {
  estado: string | null;
  created_at: string | null;
}): boolean {
  return isPaymentExpired(appointment);
}
