import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendComprobanteEmail } from '@/lib/email/send-comprobante';
import { logError } from '@/lib/error-logger';

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
    .select('id, barbershop_id, estado')
    .eq('id', appointmentId)
    .single();

  if (appError || !appointment) {
    return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
  }

  if (appointment.estado === 'confirmed') {
    return NextResponse.json({ ok: true, estado: 'confirmed' });
  }

  const { data: barbershop, error: bsError } = await supabase
    .from('barbershops')
    .select('mp_access_token')
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
      await supabase
        .from('appointments')
        .update({ estado: 'confirmed', mp_payment_id: String(paymentId) })
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
