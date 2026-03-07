import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendComprobanteEmail } from '@/lib/email/send-comprobante';
import { logError } from '@/lib/error-logger';
import { isPaymentExpired, calculateNetAmount } from '@/lib/payments';

/**
 * Confirma el pago cuando el cliente vuelve de Mercado Pago con status=approved.
 * Usamos el token de la barbería para verificar el pago en MP (el pago está en su cuenta).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  if (!appointmentId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const body = (await req.json()) as { payment_id?: string };
  const paymentId = body?.payment_id;
  if (!paymentId) return NextResponse.json({ error: 'payment_id requerido' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .select('id, barbershop_id, barber_id, fecha, slot_time, estado, created_at')
    .eq('id', appointmentId)
    .single();

  if (appError || !appointment) {
    return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
  }

  // Idempotencia: si ya está confirmado, retornar sin reprocesar (evita doble email, etc.)
  if (appointment.estado === 'confirmed') {
    return NextResponse.json({ ok: true, estado: 'confirmed' });
  }

  // Expiración: si pending_payment pasó 15 min, cancelar y liberar turno
  if (isPaymentExpired(appointment)) {
    await supabase
      .from('appointments')
      .update({ estado: 'cancelled' })
      .eq('id', appointmentId);
    return NextResponse.json(
      { error: 'El tiempo para pagar la seña ha expirado. El turno fue liberado.' },
      { status: 410 }
    );
  }

  const { data: barbershop, error: bsError } = await supabase
    .from('barbershops')
    .select('mp_access_token, monto_sena, sena_comision_cliente')
    .eq('id', appointment.barbershop_id)
    .single();

  if (bsError || !barbershop?.mp_access_token) {
    return NextResponse.json({ error: 'Barbería sin Mercado Pago vinculado' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${barbershop.mp_access_token}` } }
    );
    const payment = await res.json();

    if (payment.status === 'approved') {
      // Protección final: si otro ya confirmó este slot, cancelar el actual
      let conflictQuery = supabase
        .from('appointments')
        .select('id')
        .eq('barbershop_id', appointment.barbershop_id)
        .eq('fecha', appointment.fecha)
        .eq('slot_time', appointment.slot_time)
        .eq('estado', 'confirmed')
        .neq('id', appointmentId);

      if (appointment.barber_id != null) {
        conflictQuery = conflictQuery.eq('barber_id', appointment.barber_id);
      } else {
        conflictQuery = conflictQuery.is('barber_id', null);
      }

      const { data: conflict } = await conflictQuery.limit(1);

      if (conflict && conflict.length > 0) {
        await supabase
          .from('appointments')
          .update({ estado: 'cancelled' })
          .eq('id', appointmentId);
        return NextResponse.json(
          { error: 'Este turno ya fue tomado por otro cliente. El turno fue liberado.' },
          { status: 409 }
        );
      }

      const montoPagado = typeof payment.transaction_amount === 'number' ? payment.transaction_amount : null;
      const netFromPayment = calculateNetAmount(payment);
      const montoSenaNeto =
        montoPagado != null
          ? barbershop.sena_comision_cliente
            ? (barbershop.monto_sena ?? 0)
            : netFromPayment
          : null;
      const montoSenaServicio = barbershop.monto_sena ?? 0;

      await supabase
        .from('appointments')
        .update({
          estado: 'confirmed',
          mp_payment_id: String(paymentId),
          ...(montoPagado != null && { monto_sena_pagado: montoPagado }),
          ...(montoSenaNeto != null && { monto_sena_neto: montoSenaNeto }),
          monto_sena_servicio: montoSenaServicio,
        })
        .eq('id', appointmentId);
      sendComprobanteEmail(appointmentId).catch(() => {});
      return NextResponse.json({ ok: true, estado: 'confirmed' });
    }
  } catch (err: unknown) {
    await logError({
      source: 'api',
      path: '/api/appointments/[id]/confirm-payment',
      method: 'POST',
      message: err instanceof Error ? err.message : 'Error al verificar pago',
      stack: err instanceof Error ? err.stack : undefined,
      statusCode: 500,
      metadata: { appointmentId, paymentId },
    });
    return NextResponse.json({ error: 'Error al verificar pago' }, { status: 500 });
  }

  return NextResponse.json({ ok: false, estado: appointment.estado });
}
