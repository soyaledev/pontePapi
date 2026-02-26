import emailjs from '@emailjs/nodejs';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function formatPeso(n: number): string {
  const num = Math.round(n);
  return '$ ' + num.toLocaleString('es-AR');
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
  if (!barbershop && barbershopRes.error) {
    console.error('[EmailJS] Barbershop no encontrado:', appointmentId, barbershopRes.error);
  }
  const service = serviceRes.data;
  const barber = barberRes.data ? { name: barberRes.data.name } : null;

  const tieneSenaPagada = barbershop?.requiere_sena && (barbershop?.monto_sena ?? 0) > 0 && appointment.estado === 'confirmed';

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
    cliente_telefono: appointment.cliente_telefono || '-',
    barbershop_name: barbershop?.name ?? '-',
    service_name: serviceNameWithPrice + servicePriceStr,
    barber_name: barber ? toTitleCase(barber.name) : 'Se le asignará un barbero',
    fecha: fechaFormateada,
    hora: horaCorta,
    appointment_id: appointmentId,
    comprobante_url: `${baseUrl}/reservar/confirmado?appointmentId=${encodeURIComponent(appointmentId)}`,
    logo_url: `${baseUrl}/images/logosvgPontePapi.svg`,
    pago_sena_monto: tieneSenaPagada ? formatPeso(barbershop!.monto_sena!) : 'No aplica',
    pago_sena_estado: tieneSenaPagada ? 'Aprobado' : 'No aplica',
    pago_sena_id: tieneSenaPagada ? (appointment.mp_payment_id || '-') : 'No aplica',
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
