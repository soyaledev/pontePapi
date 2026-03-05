/**
 * Envío de comprobante de reserva por correo.
 * Usa Ultramail (https://ultramailad.vercel.app) — API: POST /api/send con header X-API-Key.
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
  const apiKey = process.env.ULTRAMAIL_API_KEY;
  const templateId = process.env.ULTRAMAIL_TEMPLATE_ID;

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
      .select('name, monto_sena, requiere_sena')
      .eq('id', appointment.barbershop_id)
      .single(),
    supabase.from('services').select('name, price').eq('id', appointment.service_id).single(),
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
    : '-';

  const senaBlock = tieneSenaPagada && barbershop?.monto_sena
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:rgba(233,69,96,0.12);border:1px solid rgba(233,69,96,0.25);border-radius:12px;overflow:hidden"><tr><td style="padding:16px 20px"><p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;color:rgba(255,255,255,0.5);text-transform:uppercase">Seña abonada</p><p style="margin:0;font-size:18px;font-weight:700;color:#e94560">${formatPeso(barbershop.monto_sena)}</p></td></tr></table>`
    : '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barbert.vercel.app';
  const comprobanteUrl = `${baseUrl}/reservar/confirmado?appointmentId=${encodeURIComponent(appointmentId)}`;

  const variables: Record<string, string> = {
    cliente_nombre: toTitleCase(appointment.cliente_nombre),
    cliente_telefono: appointment.cliente_telefono || '-',
    barbershop_name: barbershop?.name ?? '-',
    service_name: serviceLabel,
    barber_name: barber ? toTitleCase(barber.name) : 'Se le asignará un barbero',
    fecha: fechaStr,
    hora: horaStr,
    comprobante_url: comprobanteUrl,
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
