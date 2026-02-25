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
  estado: string;
};

function TurnListContent({
  appointments,
  barbershopNames,
  barberNames,
  showBarbershopName,
}: {
  appointments: Appointment[];
  barbershopNames: Record<string, string>;
  barberNames: Record<string, string>;
  showBarbershopName: boolean;
}) {
  const [localAppointments, setLocalAppointments] = useState(appointments);

  async function marcarCompletado(id: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ estado: 'completed' })
      .eq('id', id);
    if (error) return;
    setLocalAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  const grouped = localAppointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = a.fecha;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return <p className={styles.empty}>No hay turnos próximos</p>;
  }

  return (
    <div className={styles.list}>
      {sortedDates.map((fecha) => (
        <div key={fecha} className={styles.dayGroup}>
          <h2 className={styles.date}>
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>
          <ul>
            {grouped[fecha]
              .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
              .map((a) => (
                <li key={a.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.time}>{a.slot_time.slice(0, 5)}</span>
                    <span className={styles.client}>{toTitleCase(a.cliente_nombre)}</span>
                  </div>
                  <div className={styles.itemSecondary}>
                    <span className={styles.phone}>{a.cliente_telefono}</span>
                    {showBarbershopName && (
                      <span className={styles.barberia}>{barbershopNames[a.barbershop_id] ?? '-'}</span>
                    )}
                    {a.barber_id && (
                      <span className={styles.barber}>
                        {showBarbershopName ? ' · ' : ''}{toTitleCase(barberNames[a.barber_id] ?? 'Barbero')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.completadoBtn}
                    onClick={() => marcarCompletado(a.id)}
                    title="Cliente llegó y se cortó"
                  >
                    Completado
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function TurnosList({
  appointments,
  barbershopNames,
  barberNames = {},
  barbershopIds,
}: {
  appointments: Appointment[];
  barbershopNames: Record<string, string>;
  barberNames?: Record<string, string>;
  barbershopIds: string[];
}) {
  const hasSingleBarbershop = barbershopIds.length <= 1;
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string>(
    barbershopIds[0] ?? ''
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  const filteredAppointments = hasSingleBarbershop
    ? appointments
    : appointments.filter((a) => a.barbershop_id === selectedBarbershopId);

  if (hasSingleBarbershop) {
    return (
      <TurnListContent
        appointments={filteredAppointments}
        barbershopNames={barbershopNames}
        barberNames={barberNames}
        showBarbershopName={false}
      />
    );
  }

  const barbershopList = barbershopIds.map((id) => ({
    id,
    name: barbershopNames[id] ?? 'Sin nombre',
  }));

  return (
    <>
      {isExpanded && (
        <div
          className={styles.barbershopBackdrop}
          onClick={() => setIsExpanded(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsExpanded(false)}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        />
      )}
      <div className={styles.multiBarbershop}>
        <button
          type="button"
          className={styles.barbershopTrigger}
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
        >
          <span className={styles.barbershopTriggerLabel}>
            {barbershopNames[selectedBarbershopId] ?? 'Barbería'}
          </span>
          <span className={styles.barbershopTriggerIcon}>{isExpanded ? '▲' : '▼'}</span>
        </button>
        <div className={`${styles.barbershopPanel} ${isExpanded ? styles.barbershopPanelExpanded : ''}`}>
          <div className={styles.barbershopPanelInner}>
            <div className={styles.barbershopTabs}>
              {barbershopList.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`${styles.barbershopTab} ${selectedBarbershopId === b.id ? styles.barbershopTabActive : ''}`}
                  onClick={() => setSelectedBarbershopId(b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <div className={styles.barbershopContent}>
              <TurnListContent
                appointments={filteredAppointments}
                barbershopNames={barbershopNames}
                barberNames={barberNames}
                showBarbershopName={false}
              />
            </div>
            <button
              type="button"
              className={styles.barbershopClose}
              onClick={() => setIsExpanded(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
