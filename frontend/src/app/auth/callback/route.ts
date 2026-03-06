import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';

function buildRedirectUrl(origin: string, next: string, request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  if (isLocalEnv) return `${origin}${next}`;
  if (forwardedHost) return `https://${forwardedHost}${next}`;
  return `${origin}${next}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dueno/turnos';

  const supabase = await createServerSupabaseClient();
  let success = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    success = !error;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    success = !error;
  }

  if (success) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email && (await isAdmin(user.email))) {
      return NextResponse.redirect(buildRedirectUrl(origin, '/admin', request));
    }
    return NextResponse.redirect(buildRedirectUrl(origin, next, request));
  }

  return NextResponse.redirect(`${origin}/dueno/login?error=auth`);
}
