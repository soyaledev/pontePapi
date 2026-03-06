import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ErroresList } from './ErroresList';
import styles from '../AdminLayout.module.css';

export default async function AdminErroresPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; resolved?: string }>;
}) {
  const params = await searchParams;
  const source = params.source?.trim() || undefined;
  const resolvedFilter = params.resolved === 'true' ? true : params.resolved === 'false' ? false : undefined;

  const admin = getSupabaseAdmin();

  let query = admin
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (source && ['api', 'client', 'webhook'].includes(source)) {
    query = query.eq('source', source);
  }
  if (resolvedFilter !== undefined) {
    query = query.eq('resolved', resolvedFilter);
  }

  const { data: errors } = await query;

  return (
    <div className={styles.pageContent}>
      <h1 className={styles.pageTitle}>Logs de errores</h1>

      <ErroresList
        errors={errors ?? []}
        currentSource={source}
        currentResolved={resolvedFilter}
      />
    </div>
  );
}
