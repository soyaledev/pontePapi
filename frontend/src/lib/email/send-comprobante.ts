import emailjs from '@emailjs/nodejs';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function formatPeso(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

export async function sendComprobanteEmail(appointmentId: string): Promise<{ ok: boolean; error?: string }> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return { ok: false, error: 'EmailJS no configurado' };
  }

  const supabase = getSupabaseAdmin();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) return { ok: false, error: 'Turno no encontrado' };

  const email = appointment.cliente_email ?? null;
  if (!email) return { ok: false, error: 'Sin correo del cliente' };

  const [barbershopRes, serviceRes, barberRes] = await Promise.all([
    supabase.from('barbershops').select('name, slug, address, city, phone, monto_sena, requiere_sena').eq('id', appointment.barbershop_id).single(),
    supabase.from('services').select('name, price').eq('id', appointment.service_id).single(),
    appointment.barber_id
      ? supabase.from('barbers').select('name').eq('id', appointment.barber_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const barbershop = barbershopRes.data;
  const service = serviceRes.data;
  const barber = barberRes.data ? { name: barberRes.data.name } : null;

  const tieneSenaPagada = barbershop?.requiere_sena && (barbershop?.monto_sena ?? 0) > 0 && appointment.estado === 'confirmed';
  const pagoSenaHtml = tieneSenaPagada
    ? `<div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.12);">
        <h2 style="font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.75rem 0;">Pago de seña</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 0.95rem;">
          <tr><td style="padding: 0.25rem 0; color: rgba(255,255,255,0.7); width: 110px;">Monto</td><td style="padding: 0.25rem 0;">${formatPeso(barbershop!.monto_sena!)}</td></tr>
          <tr><td style="padding: 0.25rem 0; color: rgba(255,255,255,0.7);">Estado</td><td style="padding: 0.25rem 0;">Aprobado</td></tr>
          ${appointment.mp_payment_id ? `<tr><td style="padding: 0.25rem 0; color: rgba(255,255,255,0.7);">ID de transacción</td><td style="padding: 0.25rem 0; font-family: monospace; font-size: 0.85rem; word-break: break-all;">${appointment.mp_payment_id}</td></tr>` : ''}
        </table>
      </div>`
    : '';

  const fechaFormateada = new Date(appointment.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const horaCorta = String(appointment.slot_time).slice(0, 5);

  const serviceNameWithPrice = service?.name ?? '-';
  const servicePriceStr = service?.price != null ? ` (${formatPeso(service.price)})` : '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barbert.vercel.app';
  const templateParams: Record<string, string> = {
    to_email: email,
    cliente_nombre: toTitleCase(appointment.cliente_nombre),
    cliente_telefono: appointment.cliente_telefono || '—',
    barbershop_name: barbershop?.name ?? '-',
    service_name: serviceNameWithPrice + servicePriceStr,
    barber_name: barber ? toTitleCase(barber.name) : 'Se le asignará un barbero',
    fecha: fechaFormateada,
    hora: horaCorta,
    appointment_id: appointmentId,
    comprobante_url: `${baseUrl}/reservar/confirmado?appointmentId=${encodeURIComponent(appointmentId)}`,
    logo_url: `${baseUrl}/images/logosvgPontePapi.svg`,
    pago_sena_html: pagoSenaHtml.trim(),
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams, {
      publicKey,
      privateKey,
    });
    return { ok: true };
  } catch (err) {
    console.error('Error enviando comprobante por email:', err);
    return { ok: false, error: 'Error al enviar el correo' };
  }
}
