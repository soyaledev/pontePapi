import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendComprobanteEmail } from '@/lib/email/send-comprobante';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(req: Request) {
  if (!MP_ACCESS_TOKEN) return new NextResponse(null, { status: 200 });

  const { type, data } = (await req.json()) as {
    type?: string;
    data?: { id: string };
  };

  if (type !== 'payment' || !data?.id) {
    return new NextResponse(null, { status: 200 });
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

      if (isUuid) {
        const { data: updated } = await supabase
          .from('appointments')
          .update({ estado: 'confirmed', mp_payment_id: String(data.id) })
          .eq('id', appointmentId)
          .select('id')
          .single();
        resolvedId = updated?.id ?? appointmentId;
      } else {
        const { data: row } = await supabase
          .from('appointments')
          .select('id')
          .eq('mp_preference_id', appointmentId)
          .single();
        if (row?.id) {
          await supabase
            .from('appointments')
            .update({ estado: 'confirmed', mp_payment_id: String(data.id) })
            .eq('id', row.id);
          resolvedId = row.id;
        }
      }

      if (resolvedId) {
        sendComprobanteEmail(resolvedId).catch((err) =>
          console.error('[webhook] Error enviando comprobante:', err)
        );
      }
    }
  } catch {
    // Ignorar errores de webhook
  }

  return new NextResponse(null, { status: 200 });
}
