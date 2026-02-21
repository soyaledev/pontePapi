import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

const router = Router();

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

router.post('/create-preference', async (req, res) => {
  const { appointmentId, barbershopId, amount, description, backUrlSuccess, backUrlFailure } =
    req.body as {
      appointmentId: string;
      barbershopId: string;
      amount: number;
      description: string;
      backUrlSuccess?: string;
      backUrlFailure?: string;
    };

  if (!appointmentId || !barbershopId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const supabase = getSupabase();
  const { data: barbershop, error: barbershopError } = await supabase
    .from('barbershops')
    .select('mp_access_token')
    .eq('id', barbershopId)
    .single();

  if (barbershopError || !barbershop?.mp_access_token) {
    return res.status(400).json({
      error: 'La barbería no tiene cuenta Mercado Pago vinculada',
    });
  }

  const marketplaceFee = Math.round(amount * 0.03);

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${barbershop.mp_access_token}`,
      },
      body: JSON.stringify({
        items: [{ title: description, quantity: 1, unit_price: amount, currency_id: 'ARS' }],
        marketplace_fee: marketplaceFee,
        back_urls: {
          success: backUrlSuccess ?? `${FRONTEND_URL}/reservar/confirmado`,
          failure: backUrlFailure ?? `${FRONTEND_URL}/reservar/error`,
          pending: backUrlSuccess ?? `${FRONTEND_URL}/reservar/confirmado`,
        },
        auto_return: 'approved',
        external_reference: appointmentId,
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.message ?? 'Error MP');
    await supabase
      .from('appointments')
      .update({ mp_preference_id: data.id })
      .eq('id', appointmentId);
    res.json({ init_point: data.init_point, preference_id: data.id });
  } catch (err: unknown) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al crear preferencia',
    });
  }
});

router.post('/webhook', async (req, res) => {
  if (!MP_ACCESS_TOKEN) return res.sendStatus(200);

  const { type, data } = req.body as { type?: string; data?: { id: string } };
  if (type !== 'payment' || !data?.id) {
    return res.sendStatus(200);
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await response.json();
    const appointmentId = payment.external_reference ?? payment.additional_info?.items?.[0]?.id;
    if (payment.status === 'approved' && appointmentId) {
      const supabase = getSupabase();
      await supabase
        .from('appointments')
        .update({ estado: 'confirmed', mp_payment_id: data.id })
        .eq('id', appointmentId);
    }
  } catch {
    // Ignorar errores de webhook
  }
  res.sendStatus(200);
});

export default router;
