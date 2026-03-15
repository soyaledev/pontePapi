import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

const ULTRAMAIL_URL = process.env.ULTRAMAIL_URL ?? 'https://ultramailad.vercel.app/api/send';
const TOKEN_EXPIRY_HOURS = 24;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();

  let user: { id: string; email: string } | null = sessionUser
    ? { id: sessionUser.id, email: sessionUser.email ?? '' }
    : null;

  if (!user?.email) {
    // Reenvío sin sesión: permitir si se pasa email en el body (usuario recién registrado)
    let body: { email?: string };
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      body = {};
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = data?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!found) {
      return NextResponse.json({ error: 'No existe una cuenta con ese correo' }, { status: 404 });
    }
    user = { id: found.id, email: found.email ?? '' };

    // Rate limit reenvío sin sesión
    const adminCheck = getSupabaseAdmin();
    const { data: existingToken } = await adminCheck
      .from('email_verification_tokens')
      .select('created_at')
      .eq('user_id', user.id)
      .single();
    if (existingToken?.created_at) {
      const created = new Date(existingToken.created_at).getTime();
      if (Date.now() - created < 2 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Esperá unos minutos antes de volver a solicitar el correo' },
          { status: 429 }
        );
      }
    }
  }

  const apiKey = process.env.ULTRAMAIL_API_KEY?.trim();
  const templateId = process.env.ULTRAMAIL_VERIFICATION_TEMPLATE_ID?.trim();

  if (!apiKey || !templateId) {
    console.error('[Verification] Ultramail no configurado');
    return NextResponse.json(
      { error: 'Servicio de correo no configurado' },
      { status: 500 }
    );
  }

  const admin = getSupabaseAdmin();

  // Verificar si ya está verificado (solo si llegó por sesión; por email ya se validó arriba)
  const { data: verified } = await admin
    .from('owner_email_verified')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (verified) {
    return NextResponse.json({ ok: true, message: 'Email ya verificado' });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Guardar o actualizar token
  await admin.from('email_verification_tokens').upsert(
    { user_id: user.id, token, expires_at: expiresAt.toISOString() },
    { onConflict: 'user_id' }
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pontepapi.com';
  const confirmarUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  try {
    const res = await fetch(ULTRAMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        template_id: templateId,
        to: user.email,
        variables: {
          confirmar_url: confirmarUrl,
          email: user.email,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Verification] Ultramail error:', res.status, text);
      return NextResponse.json(
        { error: 'Error al enviar el correo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Verification]', err);
    return NextResponse.json(
      { error: 'Error al enviar el correo' },
      { status: 500 }
    );
  }
}
