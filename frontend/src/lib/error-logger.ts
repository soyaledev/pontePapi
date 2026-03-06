/**
 * Registra errores en la tabla error_logs para diagnóstico.
 * Nunca lanza excepciones para no romper el flujo principal.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type ErrorSource = 'api' | 'client' | 'webhook';

export async function logError(params: {
  source: ErrorSource;
  path: string;
  method?: string;
  message: string;
  stack?: string;
  statusCode?: number;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('error_logs').insert({
      source: params.source,
      path: params.path,
      method: params.method ?? null,
      message: params.message,
      stack: params.stack ?? null,
      status_code: params.statusCode ?? null,
      user_id: params.userId ?? null,
      user_email: params.userEmail ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Silenciar - nunca romper el flujo por fallo de logging
  }
}
