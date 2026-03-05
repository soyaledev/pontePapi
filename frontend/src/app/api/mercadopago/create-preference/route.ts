import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const {
    appointmentId,
    barbershopId,
    description,
    backUrlSuccess,
    backUrlFailure,
  } = (await req.json()) as {
    appointmentId: string;
    barbershopId: string;
    description: string;
    backUrlSuccess?: string;
    backUrlFailure?: string;
  };

  if (!appointmentId || !barbershopId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: barbershop, error: barbershopError } = await supabase
    .from('barbershops')
    .select('mp_access_token, monto_sena, requiere_sena, sena_comision_cliente')
    .eq('id', barbershopId)
    .single();

  if (barbershopError || !barbershop?.mp_access_token) {
    return NextResponse.json(
      { error: 'La barbería no tiene cuenta Mercado Pago vinculada' },
      { status: 400 }
    );
  }

  const montoNeto = barbershop.monto_sena ?? 0;
  if (!barbershop.requiere_sena || montoNeto <= 0) {
    return NextResponse.json({ error: 'Esta barbería no requiere seña' }, { status: 400 });
  }

  const MP_PERCENT = 10.61;
  let amount: number;
  let marketplaceFee: number;

  if (barbershop.sena_comision_cliente) {
    const exacto = montoNeto / (1 - MP_PERCENT / 100);
    amount = Math.ceil(exacto / 50) * 50;
    const surplus = amount - exacto;
    marketplaceFee = Math.round(amount * 0.03 + surplus);
  } else {
    amount = montoNeto;
    marketplaceFee = Math.round(amount * 0.03);
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.FRONTEND_URL ?? 'http://localhost:3000';

  try {
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${barbershop.mp_access_token}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: description,
              quantity: 1,
              unit_price: amount,
              currency_id: 'ARS',
            },
          ],
          marketplace_fee: marketplaceFee,
          back_urls: {
            success:
              backUrlSuccess ?? `${baseUrl}/reservar/confirmado`,
            failure: backUrlFailure ?? `${baseUrl}/reservar/error`,
            pending: backUrlSuccess ?? `${baseUrl}/reservar/confirmado`,
          },
          auto_return: 'approved',
          external_reference: appointmentId,
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.message ?? 'Error MP');

    await supabase
      .from('appointments')
      .update({ mp_preference_id: data.id })
      .eq('id', appointmentId);

    return NextResponse.json({
      init_point: data.init_point,
      preference_id: data.id,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Error al crear preferencia',
      },
      { status: 500 }
    );
  }
}
