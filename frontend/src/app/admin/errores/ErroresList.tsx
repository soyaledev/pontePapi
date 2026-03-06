'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../AdminLayout.module.css';

type ErrorLog = {
  id: string;
  source: string;
  path: string | null;
  method: string | null;
  message: string;
  stack: string | null;
  status_code: number | null;
  user_id: string | null;
  user_email: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
};

export function ErroresList({
  errors,
  currentSource,
  currentResolved,
}: {
  errors: ErrorLog[];
  currentSource?: string;
  currentResolved?: boolean;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (key === 'source' && value) params.set('source', value);
    if (key === 'resolved' && value) params.set('resolved', value);
    router.push(`/admin/errores?${params.toString()}`);
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/admin/resolve-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <>
      <div className={styles.filters}>
        <select
          value={currentSource ?? ''}
          onChange={(e) => updateFilter('source', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos los orígenes</option>
          <option value="api">API</option>
          <option value="client">Cliente</option>
          <option value="webhook">Webhook</option>
        </select>
        <select
          value={currentResolved === undefined ? '' : currentResolved ? 'true' : 'false'}
          onChange={(e) => updateFilter('resolved', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos</option>
          <option value="false">No resueltos</option>
          <option value="true">Resueltos</option>
        </select>
      </div>

      <div className={styles.errorList}>
        {errors.length === 0 ? (
          <p className={styles.empty}>No hay errores registrados</p>
        ) : (
          errors.map((err) => (
            <div
              key={err.id}
              className={`${styles.errorCard} ${err.resolved ? styles.errorCardResolved : ''}`}
            >
              <div className={styles.errorHeader}>
                <span className={styles.errorSource}>{err.source}</span>
                {err.path && <span className={styles.errorPath}>{err.method ?? '?'} {err.path}</span>}
                <span className={styles.errorTime}>
                  {new Date(err.created_at).toLocaleString('es-AR')}
                </span>
                {!err.resolved && (
                  <button
                    type="button"
                    onClick={() => handleResolve(err.id)}
                    disabled={resolvingId === err.id}
                    className={styles.resolveBtn}
                  >
                    {resolvingId === err.id ? '...' : 'Marcar resuelto'}
                  </button>
                )}
              </div>
              <p className={styles.errorMessage}>{err.message}</p>
              {err.user_email && (
                <p className={styles.errorUser}>Usuario: {err.user_email}</p>
              )}
              {err.status_code && (
                <p className={styles.errorStatus}>Status: {err.status_code}</p>
              )}
              {err.stack && (
                <div className={styles.errorStack}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                    className={styles.expandBtn}
                  >
                    {expandedId === err.id ? 'Ocultar stack' : 'Ver stack trace'}
                  </button>
                  {expandedId === err.id && (
                    <pre className={styles.stackPre}>{err.stack}</pre>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
