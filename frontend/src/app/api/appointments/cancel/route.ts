import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Cancela un turno que quedó en pending_payment (usuario canceló/falió el pago).
 * Solo permite cancelar turnos con estado pending_payment.
 */
export async function POST(req: Request) {
  const { appointmentId } = (await req.json()) as { appointmentId?: string };
  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId requerido' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('id, estado')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });
  }

  if (appointment.estado !== 'pending_payment') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { error } = await supabase
    .from('appointments')
    .update({ estado: 'cancelled' })
    .eq('id', appointmentId)
    .eq('estado', 'pending_payment');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
