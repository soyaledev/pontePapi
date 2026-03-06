/**
 * Helpers para pagos con MercadoPago.
 * Centraliza lógica de cálculo de montos, expiración y verificación de webhooks.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/** Factor de retención MP (~10.61%) para estimación cuando no hay net_received_amount */
const MP_FEE_FACTOR = 1 - 10.61 / 100; // 0.8939

/** Minutos hasta que expire un pago pendiente */
export const PAYMENT_EXPIRY_MINUTES = 15;

/**
 * Calcula el monto neto que recibe el vendedor.
 * Prioriza SIEMPRE payment.transaction_details.net_received_amount.
 * Solo usa estimación (transaction_amount * 0.8939) si no existe.
 */
export function calculateNetAmount(payment: {
  transaction_amount?: number;
  transaction_details?: { net_received_amount?: number };
}): number | null {
  const transactionAmount =
    typeof payment.transaction_amount === 'number' ? payment.transaction_amount : null;
  if (transactionAmount == null) return null;

  const netReceived =
    typeof payment.transaction_details?.net_received_amount === 'number'
      ? payment.transaction_details.net_received_amount
      : null;

  if (netReceived != null) return netReceived;
  return Math.round(transactionAmount * MP_FEE_FACTOR);
}

/**
 * Indica si un appointment en pending_payment ha expirado.
 * Expira exactamente 15 minutos después de created_at.
 */
export function isPaymentExpired(appointment: {
  estado: string | null;
  created_at: string | null;
}): boolean {
  if (appointment.estado !== 'pending_payment') return false;
  const createdAt = appointment.created_at;
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  const expiryMs = PAYMENT_EXPIRY_MINUTES * 60 * 1000;
  return Date.now() > created + expiryMs;
}

/**
 * Verifica la firma x-signature del webhook de MercadoPago.
 * Formato: ts=<timestamp>,v1=<signature>
 * Manifest: id:<dataId>;request-id:<xRequestId>;ts:<ts>;
 *
 * @returns true si la firma es válida o si no hay secret configurado (skip)
 */
export function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string | undefined
): boolean {
  if (!secret?.trim()) return true; // Sin secret, no verificar (comportamiento legacy)

  if (!xSignature?.trim() || !xRequestId?.trim()) return false;

  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const p of parts) {
    const [key, val] = p.split('=');
    if (key?.trim() === 'ts') ts = (val ?? '').trim();
    if (key?.trim() === 'v1') v1 = (val ?? '').trim();
  }
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  if (expected.length !== v1.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}
