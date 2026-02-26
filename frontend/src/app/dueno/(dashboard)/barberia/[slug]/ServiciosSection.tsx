'use client';

import { useState } from 'react';
import { formatPeso } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import { dispatchPanelVisibilityUpdate } from './VisibilityNotice';
import styles from './ServiciosSection.module.css';

type Service = {
  id: string;
  name: string;
  price: number;
  duracion_min: number;
};

export function ServiciosSection({
  barbershopId,
  services: initialServices,
}: {
  barbershopId: string;
  services: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duracion_min: '' });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('services').insert({
        barbershop_id: barbershopId,
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        duracion_min: parseInt(form.duracion_min, 10) || 30,
      }).select().single();
      if (error) throw error;
      setServices((s) => [...s, data]);
      setForm({ name: '', price: '', duracion_min: '' });
      setShowForm(false);
      dispatchPanelVisibilityUpdate();
    } catch {
      // Error al agregar servicio
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) {
      setServices((s) => s.filter((x) => x.id !== id));
      dispatchPanelVisibilityUpdate();
    }
  }

  return (
    <section className={styles.section}>
      <h2>Servicios</h2>
      <ul className={styles.list}>
        {services.map((s) => (
          <li key={s.id} className={styles.item}>
            <span className={styles.itemName}>{s.name}</span>
            <span className={styles.itemPrice}>{formatPeso(s.price)}</span>
            <span className={styles.itemDur}>{s.duracion_min} min</span>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              className={styles.delete}
              aria-label="Eliminar"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {showForm ? (
        <form onSubmit={handleAdd} className={styles.form}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className={styles.input}
            required
            min={0}
            step={0.01}
          />
          <input
            type="number"
            placeholder="Duración (min)"
            value={form.duracion_min}
            onChange={(e) => setForm((f) => ({ ...f, duracion_min: e.target.value }))}
            className={styles.input}
            min={1}
            required
          />
          <div className={styles.formActions}>
            <button type="submit" disabled={loading}>
              {loading ? '...' : 'Agregar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className={styles.addBtn}>
          + Agregar servicio
        </button>
      )}
    </section>
  );
}
