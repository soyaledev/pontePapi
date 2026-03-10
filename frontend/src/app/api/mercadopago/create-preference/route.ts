import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isPaymentExpired } from '@/lib/payments';

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

  // Validar expiración antes de crear preferencia: si pending_payment expiró, cancelar y liberar turno
  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .select('id, estado, created_at')
    .eq('id', appointmentId)
    .single();

  if (!appError && appointment && isPaymentExpired(appointment)) {
    await supabase
      .from('appointments')
      .update({ estado: 'cancelled' })
      .eq('id', appointmentId);
    return NextResponse.json(
      { error: 'El tiempo para pagar la seña ha expirado. El turno fue liberado.' },
      { status: 410 }
    );
  }

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

  // #region agent log
  fetch('http://127.0.0.1:7939/ingest/ce6f701b-fd9f-484e-a36c-bf6777e06b66',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'871633'},body:JSON.stringify({sessionId:'871633',location:'create-preference/route.ts:preference-params',message:'Params antes de crear preferencia MP',data:{barbershopId,appointmentId,amount,marketplaceFee,sena_comision_cliente:!!barbershop.sena_comision_cliente,montoNeto},hypothesisId:'H1,H2,H3',timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7939/ingest/ce6f701b-fd9f-484e-a36c-bf6777e06b66',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'871633'},body:JSON.stringify({sessionId:'871633',location:'create-preference/route.ts:mp-response',message:'Respuesta API MP create preference',data:{mpStatus:response.status,mpError:data.error,mpMessage:data.message,hasInitPoint:!!data.init_point,preferenceId:data.id,backUrlSuccess:backUrlSuccess??undefined,baseUrl},hypothesisId:'H2,H4,H5',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    const msg = err instanceof Error ? err.message : 'Error al crear preferencia';
    await import('@/lib/error-logger').then(({ logError }) =>
      logError({
        source: 'api',
        path: '/api/mercadopago/create-preference',
        method: 'POST',
        message: msg,
        stack: err instanceof Error ? err.stack : undefined,
        statusCode: 500,
        metadata: { appointmentId, barbershopId },
      })
    );
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
