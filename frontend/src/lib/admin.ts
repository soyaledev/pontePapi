import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Verifica si un email está en la tabla admin_emails.
 * Usa el cliente admin (service role) para bypassear RLS.
 */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email?.trim()) return false;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_emails')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * Devuelve la cantidad de errores no resueltos en error_logs.
 */
export async function getUnresolvedErrorCount(): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
