/**
 * Registro de cuenta dueño con verificación de correo propia (Ultramail).
 * Crea el usuario en Supabase con email_confirm: false y envía correo vía Ultramail.
 * No usa la verificación de Supabase.
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

const ULTRAMAIL_URL = process.env.ULTRAMAIL_URL ?? 'https://ultramailad.vercel.app/api/send';
const TOKEN_EXPIRY_HOURS = 24;

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const apiKey = process.env.ULTRAMAIL_API_KEY?.trim();
  const templateId = process.env.ULTRAMAIL_VERIFICATION_TEMPLATE_ID?.trim();

  if (!apiKey || !templateId) {
    console.error('[Register] Ultramail no configurado');
    return NextResponse.json(
      { error: 'Servicio de correo no configurado' },
      { status: 500 }
    );
  }

  const admin = getSupabaseAdmin();

  // Crear usuario con email sin confirmar (no envía Supabase su correo)
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (createError) {
    const msg = createError.message?.toLowerCase() ?? '';
    if (msg.includes('already') || msg.includes('exist')) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }
    console.error('[Register]', createError);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }

  if (!userData.user) {
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await admin.from('email_verification_tokens').upsert(
    { user_id: userData.user.id, token, expires_at: expiresAt.toISOString() },
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
        to: email,
        variables: {
          confirmar_url: confirmarUrl,
          email,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Register] Ultramail error:', res.status, text);
      // Usuario ya creado; podrá solicitar reenvío en verificar-correo
      return NextResponse.json({
        ok: true,
        message: 'Cuenta creada. Hubo un error al enviar el correo; podés solicitarlo de nuevo en el panel.',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Register]', err);
    return NextResponse.json({
      ok: true,
      message: 'Cuenta creada. Hubo un error al enviar el correo; podés solicitarlo de nuevo en el panel.',
    });
  }
}
