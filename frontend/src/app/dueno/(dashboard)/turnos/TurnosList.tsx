'use client';

import { useState, useEffect } from 'react';
import { toTitleCase } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import styles from './Turnos.module.css';

type Appointment = {
  id: string;
  barbershop_id: string;
  barber_id: string | null;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string | null;
  estado: string;
};

export function TurnosList({
  appointments: initialAppointments,
  pastAppointments: initialPast = [],
  barberNames = {},
}: {
  appointments: Appointment[];
  pastAppointments?: Appointment[];
  barberNames?: Record<string, string>;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [pastAppointments, setPastAppointments] = useState(initialPast);
  const [pastOpen, setPastOpen] = useState(false);
  const [modalAppointment, setModalAppointment] = useState<Appointment | null>(null);
  const [modalSource, setModalSource] = useState<'upcoming' | 'past'>('upcoming');
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    setPastAppointments(initialPast);
  }, [initialPast]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAppointment(null);
    }
    if (modalAppointment) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [modalAppointment]);

  async function marcarEstado(id: string, estado: 'completed' | 'cancelled') {
    const { error } = await supabase
      .from('appointments')
      .update({ estado })
      .eq('id', id);
    if (error) return;
    if (modalSource === 'past') {
      setPastAppointments((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
    setModalAppointment(null);
  }

  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  function formatDateLabel(fecha: string): string {
    if (fecha === today) return 'Hoy';
    if (fecha === tomorrow) return 'Mañana';
    if (fecha === yesterday) return 'Ayer';
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  function groupByDate(items: Appointment[]) {
    return items.reduce<Record<string, Appointment[]>>((acc, a) => {
      const key = a.fecha;
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});
  }

  async function copiarDia(fecha: string, items: Appointment[]) {
    const sorted = [...items].sort((a, b) => a.slot_time.localeCompare(b.slot_time));
    const lineas = sorted.map(
      (a) =>
        `${a.slot_time.slice(0, 5)} ${toTitleCase(a.cliente_nombre)}${a.barber_id && barberNames[a.barber_id] ? ` - ${toTitleCase(barberNames[a.barber_id])}` : ''}`
    );
    const texto = [formatDateLabel(fecha), ...lineas].join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedDate(fecha);
      setTimeout(() => setCopiedDate(null), 2000);
    } catch {
      // Fallback si clipboard API falla
    }
  }

  function openModal(a: Appointment, source: 'upcoming' | 'past') {
    setModalAppointment(a);
    setModalSource(source);
  }

  function renderItem(a: Appointment, source: 'upcoming' | 'past') {
    return (
      <li
        key={a.id}
        className={`${styles.item} ${styles.itemClickable}`}
        role="button"
        tabIndex={0}
        onClick={() => openModal(a, source)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openModal(a, source))}
      >
        <div className={styles.itemMain}>
          <span className={styles.time}>{a.slot_time.slice(0, 5)}</span>
          <span className={styles.client}>{toTitleCase(a.cliente_nombre)}</span>
        </div>
        <div className={styles.itemSecondary}>
          {a.barber_id && toTitleCase(barberNames[a.barber_id] ?? 'Barbero')}
        </div>
      </li>
    );
  }

  const groupedProximos = groupByDate(appointments);
  const sortedDatesProximos = Object.keys(groupedProximos).sort();

  const groupedPast = groupByDate(pastAppointments);
  const sortedDatesPast = Object.keys(groupedPast).sort().reverse();

  return (
    <div className={styles.list}>
      {sortedDatesProximos.length > 0 ? (
        sortedDatesProximos.map((fecha) => (
          <div key={fecha} className={styles.dayGroup}>
            <div className={styles.dateRow}>
              <h2 className={`${styles.date} ${fecha === today ? styles.dateToday : ''}`}>
                {formatDateLabel(fecha)}
              </h2>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => copiarDia(fecha, groupedProximos[fecha])}
                title="Copiar turnos para pegar en Notas"
                aria-label={copiedDate === fecha ? 'Copiado' : 'Copiar turnos del día'}
              >
                {copiedDate === fecha ? (
                  <span className={styles.copyCheck}>✓</span>
                ) : (
                  <svg className={styles.copyIcon} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <ul>
              {groupedProximos[fecha]
                .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
                .map((a) => renderItem(a, 'upcoming'))}
            </ul>
          </div>
        ))
      ) : (
        <p className={styles.empty}>No hay turnos próximos</p>
      )}

      {sortedDatesPast.length > 0 && (
        <div className={styles.pastSection}>
          <button
            type="button"
            className={styles.pastToggle}
            onClick={() => setPastOpen((o) => !o)}
            aria-expanded={pastOpen}
          >
            <span className={styles.pastToggleText}>
              Turnos sin marcar
              <span className={styles.pastBadge}>{pastAppointments.length}</span>
            </span>
            <svg
              className={`${styles.pastChevron} ${pastOpen ? styles.pastChevronOpen : ''}`}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {pastOpen && (
            <div className={styles.pastContent}>
              <p className={styles.pastHint}>
                Estos turnos ya pasaron pero no fueron marcados. Tocá uno para marcar si vino o no.
              </p>
              {sortedDatesPast.map((fecha) => (
                <div key={fecha} className={styles.dayGroup}>
                  <div className={styles.dateRow}>
                    <h2 className={styles.date}>
                      {formatDateLabel(fecha)}
                    </h2>
                  </div>
                  <ul>
                    {groupedPast[fecha]
                      .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
                      .map((a) => renderItem(a, 'past'))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalAppointment && (
        <div
          className={styles.modalOverlay}
          onClick={() => !modalLoading && setModalAppointment(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cliente-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cliente-modal-title" className={styles.modalTitle}>
              {toTitleCase(modalAppointment.cliente_nombre)}
            </h2>
            <dl className={styles.modalInfo}>
              <dt>Teléfono</dt>
              <dd>
                {modalAppointment.cliente_telefono ? (
                  <a href={`tel:${modalAppointment.cliente_telefono}`}>{modalAppointment.cliente_telefono}</a>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Correo</dt>
              <dd>
                {modalAppointment.cliente_email ? (
                  <a href={`mailto:${modalAppointment.cliente_email}`}>
                    {modalAppointment.cliente_email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnVino}
                disabled={modalLoading}
                onClick={async () => {
                  setModalLoading(true);
                  await marcarEstado(modalAppointment.id, 'completed');
                  setModalLoading(false);
                }}
              >
                Si vino
              </button>
              <button
                type="button"
                className={styles.btnNoVino}
                disabled={modalLoading}
                onClick={async () => {
                  setModalLoading(true);
                  await marcarEstado(modalAppointment.id, 'cancelled');
                  setModalLoading(false);
                }}
              >
                No vino
              </button>
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => !modalLoading && setModalAppointment(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
