'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { dispatchPanelVisibilityUpdate } from './VisibilityNotice';
import styles from './HorariosSection.module.css';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Schedule = {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
};

export function HorariosSection({
  barbershopId,
  schedules: initialSchedules,
}: {
  barbershopId: string;
  schedules: Schedule[];
}) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ open_time: '09:00', close_time: '18:00' });

  async function handleSave(dayOfWeek: number) {
    const { data, error } = await supabase.from('schedules').upsert(
      {
        barbershop_id: barbershopId,
        day_of_week: dayOfWeek,
        open_time: form.open_time,
        close_time: form.close_time,
      },
      { onConflict: 'barbershop_id,day_of_week' }
    ).select().single();
    if (!error && data) {
      setSchedules((s) => {
        const filtered = s.filter((x) => x.day_of_week !== dayOfWeek);
        return [...filtered, data];
      });
      setEditing(null);
      dispatchPanelVisibilityUpdate();
    }
  }

  const scheduleMap = new Map(schedules.map((s) => [s.day_of_week, s]));

  async function handleCerrado(dayOfWeek: number) {
    const s = scheduleMap.get(dayOfWeek);
    if (s?.id) {
      const { error } = await supabase.from('schedules').delete().eq('id', s.id);
      if (!error) {
        setSchedules((prev) => prev.filter((x) => x.day_of_week !== dayOfWeek));
        dispatchPanelVisibilityUpdate();
      }
    }
    setEditing(null);
  }


  return (
    <section className={styles.section}>
      <h2>Horarios</h2>
      <ul className={styles.list}>
        {DAYS.map((day, i) => {
          const s = scheduleMap.get(i);
          const isEditing = editing === i;
          return (
            <li key={i} className={styles.item}>
              <span className={styles.day}>{day}</span>
              {isEditing ? (
                <div className={styles.editRow}>
                  <input
                    type="time"
                    value={form.open_time}
                    onChange={(e) => setForm((f) => ({ ...f, open_time: e.target.value }))}
                    className={styles.input}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={form.close_time}
                    onChange={(e) => setForm((f) => ({ ...f, close_time: e.target.value }))}
                    className={styles.input}
                  />
                  <button onClick={() => handleSave(i)} className={styles.saveBtn}>
                    Guardar
                  </button>
                  <button onClick={() => handleCerrado(i)} className={styles.cerradoBtn}>
                    Cerrado
                  </button>
                  <button onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              ) : (
                <>
                  <span className={styles.time}>
                    {s ? `${s.open_time.slice(0, 5)} - ${s.close_time.slice(0, 5)}` : 'Cerrado'}
                  </span>
                  <button
                    onClick={() => {
                      setEditing(i);
                      if (s) setForm({ open_time: s.open_time, close_time: s.close_time });
                    }}
                    className={styles.editBtn}
                  >
                    {s ? 'Editar' : 'Agregar'}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
