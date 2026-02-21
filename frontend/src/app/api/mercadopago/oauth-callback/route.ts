import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { code, code_verifier, barbershopId } = body as {
    code?: string;
    code_verifier?: string;
    barbershopId?: string;
  };

  if (!code || !barbershopId) {
    return NextResponse.json(
      { error: 'Datos faltantes', slug: null },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado', slug: null }, { status: 401 });
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, slug, owner_id')
    .eq('id', barbershopId)
    .single();

  if (!barbershop || barbershop.owner_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado', slug: null }, { status: 403 });
  }

  const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID ?? process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri =
    process.env.NEXT_PUBLIC_MP_REDIRECT_URI ??
    process.env.MP_REDIRECT_URI ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/dueno/mercadopago/callback`
      : 'http://localhost:3000/dueno/mercadopago/callback');

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'MP no configurado', slug: barbershop.slug },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  if (code_verifier) {
    params.set('code_verifier', code_verifier);
  }

  const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.json(
      { error: 'Error al obtener tokens MP', slug: barbershop.slug },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('barbershops')
    .update({
      mp_access_token: tokenData.access_token,
      mp_refresh_token: tokenData.refresh_token ?? null,
      mp_user_id: tokenData.user_id ?? null,
    })
    .eq('id', barbershop.id);

  if (error) {
    return NextResponse.json(
      { error: 'Error al guardar', slug: barbershop.slug },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    slug: barbershop.slug,
  });
}
