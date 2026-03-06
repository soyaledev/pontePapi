import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendComprobanteEmail } from '@/lib/email/send-comprobante';
import { logError } from '@/lib/error-logger';
import { verifyWebhookSignature, calculateNetAmount } from '@/lib/payments';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!MP_ACCESS_TOKEN) return new NextResponse(null, { status: 200 });

  const { type, data } = (await req.json()) as {
    type?: string;
    data?: { id: string };
  };

  if (type !== 'payment' || !data?.id) {
    return new NextResponse(null, { status: 200 });
  }

  // Verificación de firma del webhook (seguridad)
  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  if (MP_WEBHOOK_SECRET) {
    const isValid = verifyWebhookSignature(xSignature, xRequestId, data.id, MP_WEBHOOK_SECRET);
    if (!isValid) {
      return new NextResponse(null, { status: 401 });
    }
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      }
    );
    const payment = await response.json();

    let appointmentId: string | null =
      payment.external_reference ??
      payment.additional_info?.items?.[0]?.id ??
      null;

    if (!appointmentId && payment.metadata?.preference_id) {
      appointmentId = payment.metadata.preference_id;
    }

    const supabase = getSupabaseAdmin();

    if (appointmentId && payment.status === 'approved') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      let resolvedId: string | null = null;

      const montoPagado = typeof payment.transaction_amount === 'number' ? payment.transaction_amount : null;

      const { data: appRow } = isUuid
        ? await supabase.from('appointments').select('id, barbershop_id, barber_id, fecha, slot_time').eq('id', appointmentId).single()
        : await supabase.from('appointments').select('id, barbershop_id, barber_id, fecha, slot_time').eq('mp_preference_id', appointmentId).single();

      if (appRow?.id) {
        // Protección final: si otro ya confirmó este slot, cancelar el actual
        let conflictQuery = supabase
          .from('appointments')
          .select('id')
          .eq('barbershop_id', appRow.barbershop_id)
          .eq('fecha', appRow.fecha)
          .eq('slot_time', appRow.slot_time)
          .eq('estado', 'confirmed')
          .neq('id', appRow.id);

        if (appRow.barber_id != null) {
          conflictQuery = conflictQuery.eq('barber_id', appRow.barber_id);
        } else {
          conflictQuery = conflictQuery.is('barber_id', null);
        }

        const { data: conflict } = await conflictQuery.limit(1);

        if (conflict && conflict.length > 0) {
          await supabase
            .from('appointments')
            .update({ estado: 'cancelled' })
            .eq('id', appRow.id);
          // No enviar email ni confirmar - turno ya tomado
        } else {
          let montoSenaNeto: number | null = null;
        if (montoPagado != null && appRow.barbershop_id) {
          const { data: bs } = await supabase
            .from('barbershops')
            .select('monto_sena, sena_comision_cliente')
            .eq('id', appRow.barbershop_id)
            .single();
          const comisionCliente = !!bs?.sena_comision_cliente;
          // Usa calculateNetAmount: prioriza net_received_amount, fallback a estimación
          const netFromPayment = calculateNetAmount(payment);
          montoSenaNeto = comisionCliente ? (bs?.monto_sena ?? 0) : netFromPayment;
        }

        const updatePayload = {
          estado: 'confirmed' as const,
          mp_payment_id: String(data.id),
          ...(montoPagado != null && { monto_sena_pagado: montoPagado }),
          ...(montoSenaNeto != null && { monto_sena_neto: montoSenaNeto }),
        };

        await supabase.from('appointments').update(updatePayload).eq('id', appRow.id);
          resolvedId = appRow.id;
        }
      }

      if (resolvedId) {
        sendComprobanteEmail(resolvedId).catch((err) =>
          console.error('[webhook] Error enviando comprobante:', err)
        );
      }
    }
  } catch (err: unknown) {
    await logError({
      source: 'webhook',
      path: '/api/mercadopago/webhook',
      method: 'POST',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      metadata: { paymentId: data?.id },
    });
  }

  return new NextResponse(null, { status: 200 });
}
