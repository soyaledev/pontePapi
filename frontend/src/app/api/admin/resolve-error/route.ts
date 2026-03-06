import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logError } from '@/lib/error-logger';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const isAdminUser = await isAdmin(user.email);
    if (!isAdminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const id = body?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from('error_logs')
      .update({ resolved: true })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    await logError({
      source: 'api',
      path: '/api/admin/resolve-error',
      method: 'POST',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      statusCode: 500,
    });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
