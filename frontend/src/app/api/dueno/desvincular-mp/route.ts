import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logError } from '@/lib/error-logger';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { error } = await supabase
    .from('barbershops')
    .update({
      mp_access_token: null,
      mp_refresh_token: null,
      mp_user_id: null,
    })
    .eq('owner_id', user.id);

  if (error) {
    await logError({
      source: 'api',
      path: '/api/dueno/desvincular-mp',
      method: 'POST',
      message: error.message,
      statusCode: 500,
      userId: user.id,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json({ error: 'Error al desvincular' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
