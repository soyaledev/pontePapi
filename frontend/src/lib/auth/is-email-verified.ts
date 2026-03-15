import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Verifica si un usuario dueño tiene el email verificado.
 * Considera verificados:
 * - Usuarios en owner_email_verified
 * - Usuarios con barberías (legacy / creados antes de verificación custom)
 * - Usuarios que iniciaron sesión con Google (email ya verificado por OAuth)
 */
export async function isEmailVerified(
  userId: string,
  authProvider?: string
): Promise<boolean> {
  if (authProvider === 'google') return true;

  const admin = getSupabaseAdmin();

  const [verifiedRes, barbershopsRes] = await Promise.all([
    admin
      .from('owner_email_verified')
      .select('user_id')
      .eq('user_id', userId)
      .single(),
    admin
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .limit(1),
  ]);

  return !!(verifiedRes.data || (barbershopsRes.data && barbershopsRes.data.length > 0));
}
