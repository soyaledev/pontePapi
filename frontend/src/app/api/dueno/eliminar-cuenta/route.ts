import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logError } from '@/lib/error-logger';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Obtener barbershops del usuario
  const { data: barbershops } = await admin
    .from('barbershops')
    .select('id')
    .eq('owner_id', user.id);

  if (barbershops && barbershops.length > 0) {
    const ids = barbershops.map((b) => b.id);

    // Eliminar appointments
    await admin.from('appointments').delete().in('barbershop_id', ids);

    // Eliminar barbers (por barbershop)
    await admin.from('barbers').delete().in('barbershop_id', ids);

    // Eliminar services
    await admin.from('services').delete().in('barbershop_id', ids);

    // Eliminar schedules
    await admin.from('schedules').delete().in('barbershop_id', ids);

    // Eliminar barbershops
    await admin.from('barbershops').delete().eq('owner_id', user.id);
  }

  // Eliminar owner_profiles si existe
  await admin.from('owner_profiles').delete().eq('id', user.id);

  // Eliminar tokens y registro de verificación
  await admin.from('email_verification_tokens').delete().eq('user_id', user.id);
  await admin.from('owner_email_verified').delete().eq('user_id', user.id);

  // Eliminar usuario de auth
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    await logError({
      source: 'api',
      path: '/api/dueno/eliminar-cuenta',
      method: 'POST',
      message: deleteError.message ?? 'Error al eliminar cuenta',
      statusCode: 500,
      userId: user.id,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json({ error: deleteError.message ?? 'Error al eliminar cuenta' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
