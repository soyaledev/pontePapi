/**
 * Envío de comprobante de reserva por correo.
 * Usa Ultramail (https://ultramailad.vercel.app) — API: POST /api/send con header X-API-Key.
 * Funciona tanto para reservas con seña (tras pago MP) como sin seña (confirmación directa).
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ULTRAMAIL_URL = 'https://ultramailad.vercel.app/api/send';

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function formatPeso(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-AR');
}

export async function sendComprobanteEmail(
  appointmentId: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.ULTRAMAIL_API_KEY?.trim();
  const templateId = process.env.ULTRAMAIL_TEMPLATE_ID?.trim();

  if (!apiKey || !templateId) {
    return { ok: false, error: 'Ultramail no configurado' };
  }

  const supabase = getSupabaseAdmin();

  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (appError || !appointment) return { ok: false, error: 'Turno no encontrado' };

  const email = appointment.cliente_email?.trim();
  if (!email) return { ok: false, error: 'Sin correo del cliente' };

  const [
    { data: barbershop },
    { data: service },
    { data: barber },
  ] = await Promise.all([
    supabase
      .from('barbershops')
      .select('name, monto_sena, requiere_sena, sena_comision_cliente')
      .eq('id', appointment.barbershop_id)
      .single(),
    appointment.service_id
      ? supabase.from('services').select('name, price').eq('id', appointment.service_id).single()
      : Promise.resolve({ data: null }),
    appointment.barber_id
      ? supabase.from('barbers').select('name').eq('id', appointment.barber_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const tieneSenaPagada =
    !!barbershop?.requiere_sena &&
    (barbershop?.monto_sena ?? 0) > 0 &&
    appointment.estado === 'confirmed' &&
    !!appointment.mp_payment_id;

  const fechaStr = new Date(appointment.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const horaStr = String(appointment.slot_time).slice(0, 5);

  const serviceLabel = service?.name
    ? `${service.name}${service.price != null ? ` (${formatPeso(service.price)})` : ''}`
    : 'Servicio eliminado';

  const MP_PERCENT = 10.61;
  const MP_FEE = 1 - MP_PERCENT / 100;
  const comisionCliente = !!barbershop?.sena_comision_cliente;
  const montoSenaConfig = barbershop?.monto_sena ?? 0;
  const montoPagadoReal = (appointment as { monto_sena_pagado?: number | null }).monto_sena_pagado;
  const senaCobrada = montoPagadoReal != null && montoPagadoReal > 0
    ? montoPagadoReal
    : comisionCliente && montoSenaConfig > 0
      ? Math.ceil((montoSenaConfig / MP_FEE) / 50) * 50
      : montoSenaConfig;
  const montoNetoBarbero = montoPagadoReal != null && montoPagadoReal > 0
    ? (comisionCliente ? montoSenaConfig : Math.round(montoPagadoReal * MP_FEE))
    : montoSenaConfig;
  const restanteEnLocal = (service?.price ?? 0) - montoNetoBarbero;

  const restanteRow = tieneSenaPagada && restanteEnLocal > 0
    ? `<tr><td style="padding:6px 0;font-size:0.95rem"><span style="color:#888">Restante a abonar en la barbería</span><br/><span style="color:#1a1a1a;font-weight:700">${formatPeso(restanteEnLocal)}</span></td></tr>`
    : '';

  const senaBlock = tieneSenaPagada && senaCobrada > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee"><tr><td><p style="margin:0 0 12px;font-size:0.85rem;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.04em">Pago de seña</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 0;font-size:0.95rem"><span style="color:#888">Seña pagada</span><br/><span style="color:#1a1a1a;font-weight:500">${formatPeso(senaCobrada)}</span></td></tr><tr><td style="padding:6px 0;font-size:0.95rem"><span style="color:#888">Estado</span><br/><span style="color:#22c55e;font-weight:600">Aprobado</span></td></tr>${restanteRow}</table></td></tr></table>`
    : '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pontepapi.com';
  const comprobanteUrl = `${baseUrl}/reservar/confirmado?appointmentId=${encodeURIComponent(appointmentId)}`;
  const logoUrl = `${baseUrl}/images/logosvgPontePapi.svg`;

  const variables: Record<string, string> = {
    cliente_nombre: toTitleCase(appointment.cliente_nombre),
    cliente_telefono: appointment.cliente_telefono || '-',
    barbershop_name: barbershop?.name ?? '-',
    service_name: serviceLabel,
    barber_name: barber ? toTitleCase(barber.name) : 'Se le asignará un barbero',
    fecha: fechaStr,
    hora: horaStr,
    comprobante_url: comprobanteUrl,
    logo_url: logoUrl,
    sena_block: senaBlock,
  };

  try {
    const res = await fetch(ULTRAMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        template_id: templateId,
        to: email,
        variables,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Ultramail]', res.status, text);
      return { ok: false, error: 'Error al enviar el correo' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[Ultramail]', err);
    return { ok: false, error: 'Error al enviar el correo' };
  }
}
