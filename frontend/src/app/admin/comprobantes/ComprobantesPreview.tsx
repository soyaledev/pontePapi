'use client';

import { useState, useEffect } from 'react';
import { ComprobanteCard, type ComprobanteData } from '@/components/ComprobanteCard/ComprobanteCard';
import styles from './ComprobantesPreview.module.css';

type AppointmentOption = {
  id: string;
  label: string;
};

export function ComprobantesPreview({ appointments }: { appointments: AppointmentOption[] }) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<ComprobanteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/appointments/${selectedId}/comprobante`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError('');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Error');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <label htmlFor="comprobante-select" className={styles.label}>
          Ver comprobante de:
        </label>
        <select
          id="comprobante-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={styles.select}
        >
          <option value="">Seleccionar turno</option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.listWrap}>
          <p className={styles.listTitle}>Turnos recientes</p>
          <ul className={styles.list} role="list">
            {appointments.length === 0 ? (
              <li className={styles.listEmpty}>No hay turnos confirmados</li>
            ) : (
            appointments.map((a) => (
              <li key={a.id} className={styles.listLi}>
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`${styles.listItem} ${selectedId === a.id ? styles.listItemActive : ''}`}
                >
                  {a.label}
                </button>
              </li>
            ))
            )}
          </ul>
        </div>

        <div className={styles.preview}>
          {loading && <p className={styles.loading}>Cargando…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!selectedId && !loading && !error && (
            <p className={styles.previewEmpty}>Seleccioná un turno para ver el comprobante</p>
          )}
          {data && !loading && (
            <ComprobanteCard data={data} showLink={false} compact />
          )}
        </div>
      </div>
    </div>
  );
}
