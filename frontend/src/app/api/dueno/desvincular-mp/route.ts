import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    console.error('[desvincular-mp]', error);
    return NextResponse.json({ error: 'Error al desvincular' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
