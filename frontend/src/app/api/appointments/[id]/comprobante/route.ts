import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
  }

  const [barbershopRes, serviceRes, barberRes] = await Promise.all([
    supabase.from('barbershops').select('name, slug, address, city, phone, monto_sena, requiere_sena, sena_comision_cliente').eq('id', appointment.barbershop_id).single(),
    supabase.from('services').select('name, price').eq('id', appointment.service_id).single(),
    appointment.barber_id
      ? supabase.from('barbers').select('name').eq('id', appointment.barber_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    id: appointment.id,
    fecha: appointment.fecha,
    hora: appointment.slot_time,
    cliente: {
      nombre: appointment.cliente_nombre,
      telefono: appointment.cliente_telefono,
      email: appointment.cliente_email,
    },
    estado: appointment.estado,
    mp_payment_id: appointment.mp_payment_id,
    created_at: appointment.created_at,
    barbershop: barbershopRes.data,
    service: serviceRes.data,
    barber: barberRes.data ? { name: barberRes.data.name } : null,
  });
}
