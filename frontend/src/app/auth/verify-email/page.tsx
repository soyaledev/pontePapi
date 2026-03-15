import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect('/dueno/login?error=verification_missing');
  }

  const admin = getSupabaseAdmin();

  const { data: row, error: fetchError } = await admin
    .from('email_verification_tokens')
    .select('user_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (fetchError || !row) {
    redirect('/dueno/login?error=verification_expired');
  }

  await admin.from('owner_email_verified').upsert(
    { user_id: row.user_id, verified_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  await admin.from('email_verification_tokens').delete().eq('user_id', row.user_id);

  try {
    await admin.auth.admin.updateUserById(row.user_id, {
      email_confirm: true,
    } as { email_confirm?: boolean });
  } catch {
    // owner_email_verified es la fuente de verdad
  }

  redirect('/dueno/login?verified=1');
}
